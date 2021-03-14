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
	},
	/**
	* @description Перевод от абсолютной скорости, высоты и угла наклона траектории к глобальным координатам положения и компонентам вектора скорости
	* @param {Number} V абсолютная скорость 
	* @param {Number} H высота над поверхностью планеты
	* @param {Number} Th угол наклона отн.местного горизонта
	* @param {Number}[L = 0] L пройденная дальность в проекции на поверхность, по умолчанию - нуль
	* @return {{Vx:Number, Vy:Number, X:Number, Y:Number}}
	*/
	local2Global(V, H, Th, L = 0) {
		const H1 = H + global.ENVIRO.RE
		const Betha = L / global.ENVIRO.RE
		
		const CB = Math.cos(Betha)
		const SB = Math.sin(Betha)
		
		const X = H1 * SB
		const Y = H1 * CB
		
		const CTH = Math.cos(Th)
		const STH = Math.sin(Th)
		const localHoryzon = [CB, -SB]
		
		const Vx = (localHoryzon[0] * CTH - localHoryzon[1] * STH) * V
		const Vy = (localHoryzon[0] * STH + localHoryzon[1] * CTH) * V
		
		return {
			Vx,
			Vy,
			X,
			Y
		}
	}
}