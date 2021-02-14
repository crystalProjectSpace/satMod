'use strict'

const {RE} = require('./enviro.js')

const trajectoryUtils = {
	localHoryzonTh: function(Vx, Vy, X, Y) {
		const absV2 = Vx * Vx + Vy * Vy
		const absR2 = X * X + Y * Y
		return Math.acos((Vx * Y - Vy * X)/Math.sqrt(absV2 * absR2)) * 57.3
	},
	totalHeight: function(X, Y) {
		return Math.sqrt(X * X + Y * Y) - RE
	},
	globeRange: function(X, Y) {
		return RE * Math.atan(X/Y)
	}
}

module.exports = trajectoryUtils