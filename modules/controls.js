'use strict'

const {localHoryzonTh, totalHeight, absVelocity, globeRange} = require('./trajectoryUtils.js')

// TO DO
// Создать абстрактные функции управления углом атаки (постоянный угол, равновесное планирование, пике и т.д)
//

const genericControls = {
	AOA_functions: {
		
	},
	dM_functions: {
		
	}
}

const controlFunctions = [
	{
		/**
		* @description управление по углу атаки (нейтраль, дозвуковой разворот, постоянный угол атаки на сверхзвуке)
		*/
		alphaControls: function(stagePtr, kinematics, t) {
			let result = 0
			
			if(t < 15) {
				result = 0
			} else if (t > 15 && t < 25) {
				result = 0.9 * (0.5 * t * t - 20 * t + 187.5)
			} else if (t > 25) {
				const Vx = kinematics[0]
				const Vy = kinematics[1]
				const V = Math.sqrt(Vx * Vx + Vy * Vy)
				result = V > 450 ? -0.5 : 0
			}
			
			return result
		},
		/**
		* @description управление расходом топлива - расход постоянный
		*/
		fuelControls: function(stagePtr, kinematics, t) {
			const mCurrent = kinematics[4]
			return mCurrent > stagePtr.mDry ? 50 : 0
		}
	},
	{
		/**
		* @description управление по углу атаки (нейтраль, дозвуковой разворот, постоянный угол атаки на сверхзвуке)
		*/
		alphaControls: function(stagePtr, kinematics, t) {
			let result = 0
			const vAbs = Math.sqrt(kinematics[0] * kinematics[0] + kinematics[1] * kinematics[1])
			if(vAbs > 1000) {
				result = 4.5
			} else {
				result = -0.5
			}
			
			return result
		},
		/**
		* @description управление расходом топлива - расход постоянный
		*/
		fuelControls: function(stagePtr, kinematics, t) {
			const mCurrent = kinematics[4]
			return mCurrent > stagePtr.mDry ? 50 : 0
		}
	}
]

module.exports = controlFunctions