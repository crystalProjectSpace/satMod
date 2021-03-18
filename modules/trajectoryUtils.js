'use strict'

const trajectoryUtils = {
	/**
	* @description угол наклона к местному горизонту 
	* @return {Number}
	*/
	localHoryzonTh: function(Vx, Vy, X, Y) {
		const absV2 = Vx * Vx + Vy * Vy
		const absR2 = X * X + Y * Y
		
		return Math.acos((Vx * Y - Vy * X)/Math.sqrt(absV2 * absR2)) * Math.sign(Vy * Y + Vx * X)
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
	local2Global: function(V, H, Th, L = 0) {
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
	},
	/**
	* @description провести анализ траектории
	* @param {Array.<{kinematics: Array.<Number>, t: Number}>} массив "сырых" точек по траектории
	* @return {Array.<Array.<Number>>} Массив траекторных данных
	*/
	analyzeTrajectory: function(rawTrajectory) {
		const nTrajectory = rawTrajectory.length
		const {
			absVelocity,
			localHoryzonTh,
			totalHeight,
			globeRange
		} = trajectoryUtils
		
		let V_0 = 0
		let V_1 = 0
		let Th_0 = 0
		let Th_1 = 0
		let M0 = 0
		let M1 = 0
		const dT = rawTrajectory[1].t - rawTrajectory[0].t
		
		const result = []
		
		const {KE, RE, Atmo} = global.ENVIRO

		for(let i = 0; i < nTrajectory; i++) {
			const {t, kinematics} = rawTrajectory[i]
			const [Vx, Vy, X, Y, m] = kinematics
			const Vabs = absVelocity(Vx, Vy)
			const V2 = Vabs * Vabs
			const ThLocal = localHoryzonTh(Vx, Vy, X, Y)
			const H = totalHeight(X, Y)
			const L = globeRange(X, Y)

			const hTotal = H + RE
			const g = KE / (hTotal * hTotal)

			let nX = 0
			let nY = 0
			let dM = 0
			
			if(i > 0) {				
				V_0 = V_1
				Th_0 = Th_1
				V_1 = Vabs
				Th_1 = ThLocal
				const Th_av = 0.5 * (Th_0 + Th_1)
				const V_av = 0.5 * (V_1 + V_0)
				nX = ((V_1 - V_0) / dT) + g * Math.sin(Th_av)
				nY = (V_av * (Th_1 - Th_0) / dT) + g * Math.cos(Th_av) - (V2 / hTotal) // учитываем центробежную разгрузку при определении Ny
				
				M0 = M1
				M1 = m
				
				dM = (M1 - M0)/dT				
			} else {
				V_1 = Vabs
				Th_1 = ThLocal
				
				M1 = m
			}

			Atmo.checkIndex(H)
			const atmoEnv = Atmo.getAtmo(H)
			const Q =  atmoEnv.Ro * V2 * 0.5
			
			result.push([
				t,		// текущее время
				Vabs,	// абсолютная скорость
				ThLocal,// угол наклона траектории к местному горизонту
				H,		// высота над уровнем планеты
				L,		// пройденная дальность
				m,		// текущая масса
				nX,		// тангенциальное ускорение
				nY,		// нормальное ускорение
				dM,		// расход массы 
				Q,		// скоростной напор
				X,		// продольная координата (ГСК)
				Y,		// поперечная координата (ГСК)
				Vx,		// скорость продольная (ГСК)
				Vy		// скорость поперечная (ГСК)
			])
		}

		return result 		
	}
}

module.exports = trajectoryUtils