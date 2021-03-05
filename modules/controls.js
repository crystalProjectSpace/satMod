'use strict'

const {localHoryzonTh, totalHeight, absVelocity, globeRange} = require('./trajectoryUtils.js')

// TODO: перенести законы разделения ступеней
// TODO: подумать, как вносить паузы между разделением по времени

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
				alpha_max	// максимально допустимый угол атаки
			}) {
			return function(stagePtr, kinematics, t) {
				const Th = localHoryzonTh(kinematics[0], kinematics[1], kinematics[2], kinematics[3])
				const Vabs = Math.sqrt(kinematics[0] * kinematics[0] + kinematics[1] * kinematics[1])
				const alpha = (Vabs > v_dive) ?
					(alpha_base - k_th * (Th - th_base)) :
					(alpha_dive - k_th_dive * (Th - th_dive))
					
				return (alpha < 0) ?
					Math.max(alpha, -alpha_max) :
					Math.min(alpha, alpha_max)
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
		}
	},
	/**
	* @description Сформировать функции управления ступенями на основе ИД из json
	* @param {Array.<{type: String, prms: Object}>} alphaControls ИД по законам управления в канале тангажа
	* @param {Array.<{type: String, prms: Object}>} fuelControls ИД по расходам топлива
	* @return {Array.<{alphaControls: Function, fuelControls: Function}>}
	*/
	setupControls: function(alpha_controls, fuel_controls) {
		const nStage = alpha_controls.length
		
		const result = []
		
		for(let i = 0; i < nStage; i++) {
			const alphaType = alpha_controls[i].type
			const alphaPrms = alpha_controls[i].prms
			const dmType = fuel_controls[i].type
			const dmPrms = fuel_controls[i].prms

			result.push({
				alphaControls: genericControls.AOA_functions[alphaType](alphaPrms),
				fuelControls: genericControls.dM_functions[dmType](dmPrms)
			})
		}
		
		return result
	}
}

module.exports = genericControls