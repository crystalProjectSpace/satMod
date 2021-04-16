'use strict'

const {
	angleBetween, sphere2decart,
	vectByScal, vect2matrix, decart2sphere, sphereDelta, azimuth
} = require('./vectorOps.js')

const Pr = 0.71 // Число Прандтля, участвует в расчете теплового состояния
const kStefBoltz = 5.67037E-8 // постоянная Стефана-Больцмана

const trajectoryUtils = {
	/**
	* @description Температура восстановления
	* @return {Number}
	*/
	stagnTemperature: function(T, M, k) {
		const dTBase = (1 + 0.5 * (k - 1) * Math.sqrt(Pr) * M * M)
		const kThermal = M < 6.5 ? 1 :
			(M > 30 ? 0.7 : 1 - 0.012765 * (M - 6.5))// учет потери энергии потока на диссоциацию и ионизацию
		return T * Math.pow(dTBase, kThermal)
	},
	/**
	 * @description осредненный местный тепловой поток
	 * @param {*} k_gas 
	 * @param {*} R_gas 
	 * @param {*} Re 
	 * @returns 
	 */
	heatFlow2: function(size, k_gas, R_gas, Ro, V, Twall, Tinf) {
		const Cp = k_gas * R_gas / (k_gas - 1)
		const V2 = V * V
		return 1.83E-4 * Math.sqrt(Ro/size) * (V * V2) * (1 - Cp * Twall / ( 0.5 * V2 + Cp * Tinf))
	},
	heatFlow2X: function(alpha, size, k_gas, R_gas, Ro, V, Twall, Tinf) {
		const Cp = k_gas * R_gas / (k_gas - 1)
		const CTA = Math.cos(alpha)
		const STA = Math.sin(alpha)
		return 2.53E-5 * STA*Math.sqrt(CTA*Ro/size) * Math.pow(V, 3.2) * (1 - Cp * Twall / ( 0.5 * V*V + Cp * Tinf))
	},
	/**
	 * @description равновесная температура с учетом переизлучения
	 */
	tEquilibrium2: function(alpha, size, k_gas, R_gas, Ro, V, kEmission, irradiation, Tstag, Tinf) {
		const qSumm = function(T) {
			const T2 = T * T
			return  trajectoryUtils.heatFlow2X(alpha, size, k_gas, R_gas, Ro, V, T, Tinf) + kEmission * (irradiation - kStefBoltz * T2 * T2)
		}

		let T1 = 0
		let T2 = Tstag

		while(Math.abs(T2 - T1) > 1E-3) {
			const T_05 = 0.5 * (T1 + T2)
			const dQ = qSumm(T_05)
			dQ > 0 ? (T1 = T_05) : (T2 = T_05)
		}

		return 0.5 * (T1 + T2)
	},
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
	analyzeTrajectory: function(rawTrajectory, vehicle, tauStage, rarify = 1) {
		const nTrajectory = rawTrajectory.length
		const {
			absVelocity,
			localHoryzonTh,
			totalHeight,
			stagnTemperature,
			tEquilibrium2
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
		let L = 0
		let currentStage = 0
		const dT = rawTrajectory[1].t - rawTrajectory[0].t
		
		const result = []
		
		const {KE, RE, Atmo, k_gas, R_gas, solar_constant} = global.ENVIRO

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
			
			if(t > tauStage[currentStage]) { currentStage++ }
			
			let nX = 0
			let nY = 0
			let nZ = 0
			let dM = 0
			
			if(i > 0) {
				W_0 = W_1
				L_0 = L_1
				W_1 = spherCor.W
				L_1 = spherCor.L
				Fi_0 = Fi_1
				Fi_1 = azimuth([Vx, Vy, Vz], [X, Y, Z])

				L += (RE * Math.abs(sphereDelta(W_0, L_0, W_1, L_1)))

				V_0 = V_1
				Th_0 = Th_1
				V_1 = Vabs
				Th_1 = ThLocal
				const Th_av = 0.5 * (Th_0 + Th_1)
				const V_av = 0.5 * (V_1 + V_0)
				nX = ((V_1 - V_0) / dT) + g * Math.sin(Th_av)
				nY = (V_av * (Th_1 - Th_0) / dT) + g * Math.cos(Th_av) - (V2 / hTotal) // учитываем центробежную разгрузку при определении Ny
				nZ = 0
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
			const {aSn, Ro, T} = Atmo.getAtmo(H, true)
			const Q =  Ro * V2 * 0.5
			
			const currentStagePtr = vehicle.stages[currentStage]
			const {size, kEmission} = currentStagePtr
			const alpha = currentStagePtr.alphaControl(currentStagePtr, kinematics, t)
			const Mach = Vabs / aSn
			
			const T0 = stagnTemperature(T, Mach, k_gas)
			const Teq = tEquilibrium2(alpha/57.3, 0.5*size, k_gas, R_gas, Ro, Vabs, kEmission, solar_constant, T0, T)
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
					Vz,		// скорость поперечная
					T0,		// температура восстановления
					Teq,		// равновесная температура
					alpha
				])
			}
		}

		return result 		
	}
}

module.exports = trajectoryUtils