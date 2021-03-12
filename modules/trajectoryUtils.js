'use strict'

module.exports = {
	/**
	* @description угол наклона к местному горизонту 
	* @return {Number}
	*/
	localHoryzonTh: function(Vx, Vy, X, Y) {
		const absV2 = Vx * Vx + Vy * Vy
		const absR2 = X * X + Y * Y
		
		return Math.acos((Vx * Y - Vy * X)/Math.sqrt(absV2 * absR2)) * 57.3 * Math.sign(Vy * Y + Vx * X)
	},
	/**
	* @description высота над поверхостью планеты
	* @return {Number}
	*/
	totalHeight: function(X, Y) {
		return Math.sqrt(X * X + Y * Y) - global.ENVIRO.RE
	},
	/**
	* @description дальность полета в проекции на поверхность планеты
	* @return {Number}
	*/
	globeRange: function(X, Y) {
		return global.ENVIRO.RE * Math.atan(X/Y)
	},
	/**
	* @description модуль значения скорости
	* @return {Number}
	*/
	absVelocity: function(Vx, Vy) {
		return Math.sqrt(Vx * Vx + Vy * Vy)
	}
}