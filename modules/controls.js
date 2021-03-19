'use strict'

const {localHoryzonTh, totalHeight, absVelocity, globeRange} = require('./trajectoryUtils.js')
const {KeplerObject} = require('./kepler.js')

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
				return (stagePtr.tMECO !== 0) && (tau > stagePtr.tMECO + tauMax)
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
	* @param {Array.<{type: String, prms: Object}>} fuel_controls ИД по расходам топлива
	* @param {Array.<{type: String, prms: Object}>} stage_controls ИД по законам разделения ступеней
	* @return {Array.<{alphaControls: Function, fuelControls: Function, stageControls: Function}>}
	*/
	setupControls: function(alpha_controls, fuel_controls, stage_controls) {
		const nStage = alpha_controls.length
		
		const result = []
		
		for(let i = 0; i < nStage; i++) {
			const alphaType = alpha_controls[i].type
			const alphaPrms = alpha_controls[i].prms
			const dmType = fuel_controls[i].type
			const dmPrms = fuel_controls[i].prms
			const stageType = stage_controls[i].type
			const stagePrms = stage_controls[i].prms

			result.push({
				alphaControls: genericControls.AOA_functions[alphaType](alphaPrms),
				fuelControls: genericControls.dM_functions[dmType](dmPrms),
				cutOffControls: genericControls.stage_functions[stageType](stagePrms)
			})
		}
		
		return result
	}
}

module.exports = genericControls