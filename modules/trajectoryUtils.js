'use strict'

const Vector = require('./vectorOps.js')

const trajectoryUtils = {
	/**
	* @description угол наклона к местному горизонту 
	* @return {Number}
	*/
	localHoryzonTh: function(Vx, Vy, Vz, X, Y, Z) {
		const coord = [X, Y, Z]
		const localHoryzon = Vector.tangentPlane(coord)
		const vProject = Vector.point2plane([Vx, Vy, Vz], localHoryzon)

		return Vector.angleBetween(Vector.vectSubt(vProject, [X, Y, Z]), [Vx, Vy, Vz])
	},
	/**
	* @description высота над поверхостью планеты
	* @return {Number}
	*/
	totalHeight: function(X, Y, Z) {
		return Math.sqrt(X * X + Y * Y + Z * Z) - global.ENVIRO.RE
	},
	/**
	* @description модуль значения скорости
	* @return {Number}
	*/
	absVelocity: function(Vx, Vy, Vz) {
		return Math.sqrt(Vx * Vx + Vy * Vy + Vz * Vz)
	},
	/**
	* @description Перевод от абсолютной скорости, высоты и угла наклона траектории к глобальным координатам положения и компонентам вектора скорости
	* @param {Number} V абсолютная скорость 
	* @param {Number} H высота над поверхностью планеты
	* @param {Number} Th угол наклона отн.местного горизонта
	* @param {Number} Psi текущий курсовой угол
	* @param {Number} W стартовая широта
	* @param {Number} L стартовая долгота
	* @return {{Vx:Number, Vy:Number, Vz:Number, X:Number, Y:Number, Z:Number}}
	*/
	local2Global: function(V, H, Th, Psi, W, L) {
		const [X, Y, Z] = Vector.sphere2decart(W, L, global.ENVIRO.RE + H)

		const CTH = Math.cos(Th)
		const CPS = Math.cos(Psi)
		const STH = Math.sin(Th)
		const SPS = Math.sin(Psi)

		const _W = W > 0 ? 0.5 * Math.PI - W : -0.5 * Math.PI - W

		const CW = Math.cos(_W)
		const CL = Math.cos(L)
		const SW = Math.sin(_W)
		const SL = Math.sin(L)

		const rotationW = [
			[1,		0,		0],
			[0,		CW,		-SW],
			[0,		SW,		CW]
		]

		const rotationL = [
			[CL,	0,		SL],
			[0,		1,		0],
			[-SL,	0,		CL]
		]

		const vLocal = Vector.vectByScal([CTH * CPS, STH, CTH * SPS], V)

		const V_w = Vector.vect2matrix(rotationW, vLocal)

		const [Vx, Vy, Vz] = Vector.vect2matrix(rotationL, V_w)

		return {
			Vx,
			Vy,
			Vz,
			X,
			Y,
			Z
		}
	},
	/**
	* @description провести анализ траектории
	* @param {Array.<{kinematics: Array.<Number>, t: Number}>} массив "сырых" точек по траектории
	* @return {Array.<Array.<Number>>} Массив траекторных данных
	*/
	analyzeTrajectory: function(rawTrajectory, rarify = 1) {
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
			i === 0 ? Atmo.setupIndex(H) : Atmo.checkIndex(H)
			const atmoEnv = Atmo.getAtmo(H)
			const Q =  atmoEnv.Ro * V2 * 0.5
			
			const Mach = Vabs / atmoEnv.aSn
			if( i % rarify === 0) {
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
					Mach,	// число M
					Q,		// скоростной напор
					X,		// продольная координата (ГСК)
					Y,		// поперечная координата (ГСК)
					Vx,		// скорость продольная (ГСК)
					Vy		// скорость поперечная (ГСК)
				])
			}
		}

		return result 		
	}
}

module.exports = trajectoryUtils