'use strict'

const {
	tangentPlane, vectSubt, point2plane, angleBetween, sphere2decart,
	vectByScal, vect2matrix, decart2sphere, sphereDelta, azimuth
} = require('./vectorOps.js')

const trajectoryUtils = {
	/**
	* @description угол наклона к местному горизонту 
	* @return {Number}
	*/
	localHoryzonTh: function(Vx, Vy, Vz, X, Y, Z) {
		const coord = [X, Y, Z]
		const V = [Vx, Vy, Vz]

		const Th = -0.5 * Math.PI + angleBetween(V, coord)

		const signTh = Math.sign(Th)
		const ThAbs = Math.abs(Th)
		return ThAbs < 0.5 * Math.PI ? Th : signTh * (ThAbs - Math.PI) 
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
		const [X, Y, Z] = sphere2decart(W, L, global.ENVIRO.RE + H)

		const CTH = Math.cos(Th * Math.sign(W))
		const CPS = Math.cos(Psi)
		const STH = Math.sin(Th * Math.sign(W))
		const SPS = Math.sin(Psi)

		const _W = W > 0 ? 0.5 * Math.PI - W : -0.5 * Math.PI - W

		const CW = Math.cos(_W)
		const CL = Math.cos(L)
		const SW = Math.sin(_W)
		const SL = Math.sin(L)

		const [Vx, Vy, Vz] = vect2matrix(
			[
				[CL,	SL*SW,	SL*CW],
				[0,		CW,		-SW],
				[-SL,	CL*SW,	CL*CW]
			],
			vectByScal([CTH * CPS, STH, CTH * SPS], V)
		)

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
			totalHeight
		} = trajectoryUtils
		
		let V_0 = 0
		let V_1 = 0
		let Th_0 = 0
		let Th_1 = 0
		let M0 = 0
		let M1 = 0
		let W_0 = 0
		let W_1 = 0
		let L_0 = 0
		let L_1 = 0
		let Fi_0 = 0
		let Fi_1 = 0
		const dT = rawTrajectory[1].t - rawTrajectory[0].t
		
		const result = []
		
		const {KE, RE, Atmo} = global.ENVIRO

		for(let i = 0; i < nTrajectory; i++) {
			const {t, kinematics} = rawTrajectory[i]
			const [Vx, Vy, Vz, X, Y, Z, m] = kinematics
			const Vabs = absVelocity(Vx, Vy, Vz)
			const V2 = Vabs * Vabs
			const ThLocal = localHoryzonTh(Vx, Vy, Vz, X, Y, Z)
			const H = totalHeight(X, Y, Z)
			const hTotal = H + RE
			const g = KE / (hTotal * hTotal)
			const spherCor = decart2sphere([X, Y, Z])

			let nX = 0
			let nY = 0
			let nZ = 0
			let L = 0
			let dM = 0
			
			if(i > 0) {
				W_0 = W_1
				L_0 = L_1
				W_1 = spherCor.W
				L_1 = spherCor.L
				Fi_0 = Fi_1
				Fi_1 = azimuth([Vx, Vy, Vz], [X, Y, Z])

				L += RE * Math.abs(sphereDelta(W_0, L_0, W_1, L_1))

				V_0 = V_1
				Th_0 = Th_1
				V_1 = Vabs
				Th_1 = ThLocal
				const Th_av = 0.5 * (Th_0 + Th_1)
				const V_av = 0.5 * (V_1 + V_0)
				nX = ((V_1 - V_0) / dT) + g * Math.sin(Th_av)
				nY = (V_av * (Th_1 - Th_0) / dT) + g * Math.cos(Th_av) - (V2 / hTotal) // учитываем центробежную разгрузку при определении Ny
				nZ = (V_av * (Fi_1 - Fi_0) / dT)
				M0 = M1
				M1 = m
				
				dM = (M1 - M0)/dT				
			} else {
				V_1 = Vabs
				Th_1 = ThLocal
				W_1 = spherCor.W
				L_1 = spherCor.L
				Fi_1 = azimuth([Vx, Vy, Vz], [X, Y, Z])
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
					Fi_1,	// азимут траектории
					H,		// высота над уровнем планеты
					L,		// пройденная дальность
					m,		// текущая масса
					nX,		// тангенциальное ускорение
					nY,		// вертикальное ускорение
					nZ,		// боковое ускорение
					dM,		// расход массы 
					Mach,	// число M
					Q,		// скоростной напор
					W_1,	// широта
					L_1,	// долгота
					X,		// продольная координата (ГСК)
					Y,		// вертикальная координата (ГСК)
					Z,		// поперечная
					Vx,		// скорость продольная (ГСК)
					Vy,		// скорость вертикальная (ГСК)
					Vz		// скорость поперечная
				])
			}
		}

		return result 		
	}
}

module.exports = trajectoryUtils