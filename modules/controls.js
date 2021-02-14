'use strict'

const controlFunctions = {
	alphaControls: [
		/**
		* @description управление по углу атаки (нейтраль, дозвуковой разворот, постоянный угол атаки на сверхзвуке)
		*/
		function(stagePtr, kinematics, t) {
			let result = 0
			
			if(t < 15) {
				result = 0
			} else if (t > 15 && t < 25) {
				result = 1.2 * (0.5 * t * t - 20 * t + 187.5)
			} else if (t > 25) {
				const Vx = kinematics[0]
				const Vy = kinematics[1]
				const V = Math.sqrt(Vx * Vx + Vy * Vy)
				result = V > 450 ? -1.5 : 0
			}
			
			return result
		}
	],
	/**
	* @description управление расходом топлива - расход постоянный
	*/
	fuelControls: [
		function(stagePtr, kinematics, t) {
			const mCurrent = kinematics[4]
			return mCurrent > stagePtr.mDry ? 50 : 0
		}
	]
}

module.exports = controlFunctions