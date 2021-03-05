'use strict'

module.exports = {
	stageFunctions: [
		function(trjPoint) {
			return Math.abs(trjPoint.kinematics[4]/2300 - 1) < 1E-3 
		},
		function(kinematics, t) {
			return false
		}
	]
}
	