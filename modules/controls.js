'use strict'

const {localHoryzonTh, totalHeight, absVelocity, globeRange} = require('./trajectoryUtils.js')
const {KeplerObject} = require('./kepler.js')
const {Interp_1D} = require('./interp.js')

const genericControls = {
	// шаблоны управления в канале тангажа
	AOA_functions: {
		/**
		* @description полет с постоянным углом атаки
		* @param {{alpha_const: Number}} - фиксированный угол атаки
		* @return {Function}
		*/
		"alpha_constant": function({alpha_const}) {
			return function(stagePtr, kinematics, t) {
				return alpha_const
			}
		},
		/**
		* @description полет с удержанием постоянного угла траектории к местному горизонту
		* @param {Object} - параметры управления
		* @return {Function}
		*/
		"level_flight": function({
				alpha_base, // базовый угол атаки
				k_th,		// коэфф. чувствительност управления к углу наклона траектории
				th_base,	// удерживаемый угол наклона траектории
				v_dive,		// скорость перевода в пике
				alpha_dive,	// угол атаки при пикировании
				k_th_dive,	// коэфф. чувствительности при пикировании
				th_dive,	// удерживаемый угол снижения в пике
				alpha_max,	// максимально допустимый угол атаки
				t_pullup // высота начала маневра планирования
			}) {
			return function(stagePtr, kinematics, t) {
				const H = totalHeight(kinematics[2], kinematics[3])
				if((t_pullup && t > t_pullup) || !t_pullup) {
					const Th = localHoryzonTh(kinematics[0], kinematics[1], kinematics[2], kinematics[3])
					const Vabs = Math.sqrt(kinematics[0] * kinematics[0] + kinematics[1] * kinematics[1])

					const alpha = (Vabs > v_dive) ?
						(alpha_base - k_th * (Th - th_base)) :
						(alpha_dive - k_th_dive * (Th - th_dive))

					return (alpha < 0) ?
						Math.max(alpha, -alpha_max) :
						Math.min(alpha, alpha_max)
				} else {
					return 0
				}
			} 
		},
		/**
		* @description полет с удержанием постоянного угла траектории к местному горизонту
		* @param {Object} - параметры управления
		* @return {Function}
		*/
		"ascend_profile": function({
			maneuver_start,	// момент начала дозвукового разворота (сек)
			maneuver_end,	// момент завершения дозвукового разворота (сек)
			k2,				// коэфф. 
			k1,				// дозвукового 
			k0,				// разворота
			V_super,		// скорость начала разворота по тангажу на сверхзвуке
			alpha_base,		// угол атаки на дозвуке/малом сверхзвуке
			alpha_super		// угол атаки в сверхзвуковом развороте
		}) {
			return function(stagePtr, kinematics, t) {
				let result = 0
			
				if(t < maneuver_start) {
					result = 0
				} else if (t >= maneuver_start && t < maneuver_end) {
					result = k2 * t * t + k1 * t + k0
				} else if (t >= maneuver_end) {
					const Vx = kinematics[0]
					const Vy = kinematics[1]
					const Vabs = Math.sqrt(Vx * Vx + Vy * Vy)
					result = Vabs > V_super ? alpha_super : alpha_base
				}
				
				return result
			}
		},
		/**
		* @description Функция управления верхней ступенью с достижением заданной высоты апогея
		* @param {Object}
		* @return {Function}
		*/
		"apocenter_ascend": function({
			alphaBase,	// базовый угол атаки
			kH,			// коэффициент чувствительности
			alphaMax,	// максимальный угол атаки
			hApoReq 	// заданная высота апогея
		}) {
			return function(stagePtr, kinematics, t) {
				const Th = localHoryzonTh(kinematics[0], kinematics[1], kinematics[2], kinematics[3])
				const H = totalHeight(kinematics[2], kinematics[3])
				const V = absVelocity(kinematics[0], kinematics[1])
				const hApo = KeplerObject.getApo(V, H, Th)
				const relApoH = (hApoReq / hApo) - 1
				const alpha = alphaBase - kH * relApoH
				
				return alpha < 0 ?
					Math.max(alpha, -alphaMax) :
					Math.min(alpha, alphaMax)
			}
		},
		"diagram_alpha_t": function({
			tau_val,
			alpha_val
		}) {
			const interpolator = new Interp_1D()
			interpolator.init(0, tau_val, alpha_val)

			return function(stagePtr, kinematics, t) {
				interpolator.checkX(t)
				return interpolator.interp(t)
			}
		},
		/**
		 * @description аэроторможение при входе с V > V_круговая * kCircle. Сначала удержание в атмосфере, затем переход на равновесное планирование
		 * @param {Object} param0 параметры для формирования закона управления 
		 * @returns {Function}
		 */
		"aerobrake": function({
			alphaMax,
			alphaInsert,
			alphaGlide,
			kThInsert,
			kThGlide,
			vFinal,
			kCircle
		}) {
			
			return function(stagePtr, kinematics, t) {
				const Vx = kinematics[0]
				const Vy = kinematics[1]
				const Vz = kinematics[2]
				const X = kinematics[3]
				const Y = kinematics[4]
				const Z = kinematics[5]
				
				const V = Math.sqrt(Vx * Vx + Vy * Vy + Vz * Vz)
				const H = Math.sqrt(X * X + Y * Y + Z * Z)
				const V_circle = global.ENVIRO.vCircular(H)
				const Th = localHoryzonTh(Vx, Vy, Vz,  X, Y, Z)
				
				if(V > vFinal ) {
					const alpha = (V > V_circle) ?
					(Th > 0 ? -alphaInsert : alphaInsert) :
					alphaGlide + kThGlide * Th

					return alpha > 0 ?
						Math.min(alphaMax, alpha) :
						Math.max(-alphaMax, alpha)
				} else {
					return 0
				}
			}
		}			
	},
	// шаблоны функций управления по крену
	Roll_functions: {
		"no_roll": function() {
			return function({stagePtr, kinematics, t}) {
				return 0
			}
		}
	},
	// шаблоны управления расходом топлива
	dM_functions: {
		/**
		* @description постоянный расход топлива
		*/
		"dm_constant": function({dm_regular}) {
			return function(stagePtr, kinematics, t) {
				const mCurrent = kinematics[4]
				return mCurrent > stagePtr.mDry ? dm_regular : 0
			}
		},
		/**
		* @description ступень без двигателя (нет расхода)
		*/
		"dm_nodrain": function() {
			return function(stagePtr, kinematics, t) {
				return 0
			}
		},
		/**
		 * @description выведение на круговую орбиту
		 */
		"orbit_insertion": function({
			tauFire, // время начала скругления орбиты отн. точки апогея
			dM // программный расход
		}) {
			return function(stagePtr, kinematics, t ) {
				const Th = localHoryzonTh(kinematics[0], kinematics[1], kinematics[2], kinematics[3])
				const H = totalHeight(kinematics[2], kinematics[3])
				const V = absVelocity(kinematics[0], kinematics[1])
				
				const {tauApo} = KeplerObject.getCurrentOrb(V, H, Th)
				// Main Engine Cut-Off условие отсечки тяги - или достигли круговую скорость, или сожгли все топливо
				const MECO = (V >= global.ENVIRO.V_circular(H)) || (Math.abs(kinematics[4]/stagePtr.mDry - 1) < 1E-3)
				
				return (!MECO && tauApo >= tauFire) ? dM : 0
			}
		},
		/**
		 * @description торможение до заданной скорости
		 */
		"retro_rocket": function({
			omegaMax,
			hRetro,
			vLand
		}) {
			let vRetro = 0

			return function(stagePtr, kinematics, t) {
				const X = kinematics[3]
				const Y = kinematics[4]
				const Z = kinematics[5]
								
				const Hglob = Math.sqrt(X * X + Y * Y + Z * Z)
				const Hlocl = Hglob - global.ENVIRO.RE
				
				if(Hlocl > hRetro) {
					return 0
				} else {
					const mCurrent = kinematics[6]
					
					if(mCurrent > stagePtr.mDry) {
						const Vx = kinematics[0]
						const Vy = kinematics[1]
						const Vz = kinematics[2]
						const Vabs = Math.sqrt(Vx * Vx + Vy * Vy + Vz * Vz)
						if(!vRetro) {
							vRetro = Vabs
						}

						const dV = vLand - vRetro
						
						const omega = 0.75 * Math.abs((-9.81 + (vRetro * dV + 0.5 * dV * dV)/hRetro) * mCurrent / stagePtr.Jrel)
						return Math.min(omega, omegaMax)
					} else {
						return 0 
					}
				}
			}
		}
	},
	// шаблоны разделения ступеней
	stage_functions: {
		/**
		 * @description Разделение ступеней немедленно после выработки топлива
		 * @return {Boolean}
		 */
		"fuel_out": function() {
			return function(stagePtr, kinematics, t) {
				return !!stagePtr.tMECO
			}
		},
		/**
		 * @description Не разделять ступени
		 * @return {Boolean}
		 */
		"no_stage": function() {
			return function(stagePtr, kinematics, t) {
				return false
			}
		},
		/**
		 * @description Разделять ступени спустя заданное время
		 * @param {Number} tauMax 
		 * @returns 
		 */
		"time_out": function({tauMax}) {
			return function(stagePtr, kinematics, tau) {
				return stagePtr.mFuel > 0 ?
					((stagePtr.tMECO !== 0) && (tau > stagePtr.tMECO + tauMax)) :
					(tau > tauMax)
			}
		},
		/**
		 * @description Разделять ступени по величине скоростного напора
		 * @param {Number} qMax 
		 * @returns 
		 */
		"max_q_pass": function({qMax}) {
			return function(stagePtr, kinematics, t) {
				if(stagePtr.tMECO === 0) {
					return false
				} else {
					const H = Math.sqrt(kinematics[2] * kinematics[2] + kinematics[3] * kinematics[3]) - global.ENVIRO.RE
					const {Ro} = global.ENVIRO.Atmo.getAtmo(H)
					const vAbs_2 = kinematics[0] * kinematics[0] + kinematics[1] * kinematics[1]
					const Q = 0.5 * Ro * vAbs_2
					return Q < qMax
				}
			}
		}
	},
	/**
	* @description Сформировать функции управления ступенями на основе ИД из json
	* @param {Array.<{type: String, prms: Object}>} alpha_controls ИД по законам управления в канале тангажа
	* @param {Array.<{type: String, prms: Object}>} roll_controls ИД по законам управления в канале крена
	* @param {Array.<{type: String, prms: Object}>} fuel_controls ИД по расходам топлива
	* @param {Array.<{type: String, prms: Object}>} stage_controls ИД по законам разделения ступеней
	* @return {Array.<{alphaControls: Function, fuelControls: Function, stageControls: Function}>}
	*/
	setupControls: function(alpha_controls, fuel_controls, roll_controls, stage_controls) {
		const nStage = alpha_controls.length
		
		const result = []
		
		for(let i = 0; i < nStage; i++) {
			const alphaType = alpha_controls[i].type
			const alphaPrms = alpha_controls[i].prms
			const gammaType = roll_controls[i].type
			const gammaPrms = roll_controls[i].prms
			const dmType = fuel_controls[i].type
			const dmPrms = fuel_controls[i].prms
			const stageType = stage_controls[i].type
			const stagePrms = stage_controls[i].prms

			result.push({
				alphaControls: genericControls.AOA_functions[alphaType](alphaPrms),
				gammaControls: genericControls.Roll_functions[gammaType](gammaPrms),
				fuelControls: genericControls.dM_functions[dmType](dmPrms),
				cutOffControls: genericControls.stage_functions[stageType](stagePrms)
			})
		}
		
		return result
	}
}

module.exports = genericControls