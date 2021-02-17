'use strict'

const {KE, RE, Atmo} = require('./enviro.js')			// постоянная грав.поля Земли, радиус Земли, атмосфера
const {Interp_2D} = require('./interp.js')				// функции табличной интерполяции
const {totalHeight} = require('./trajectoryUtils.js')	// вычисление высоты из абс.координат

const activeAtmo = new Atmo()	// объект для получения параметров стандартной атмосферы

class VehicleStage {
	/**
	* @description описание ступени многоступенчатой РКН
	* @return {void}
	*/
	constructor() {
		this.mFuel = 0	//	масса топлива ступени
		this.mDry = 0	//	масса незаправленной ступени
		this.sMid = 0	//	площадь миделя
		this.Jrel = 0	//	удельный импульс ДУ
		this.CX_mod = null	//	интерполятор для CXa
		this.CY_mod = null	//	интерполятор для CYa
		
		this.alphaControl = null	// закон управления по углу атаки
		this.fuelControl = null		// закон управления расходом топлива
		
		this.kinematics = [ 0,0,0,0,0 ] // кинематические параметры (Vx, Vy, X, Y, m)
	}
	/**
	* @description задать ИД по массам конструкции, топлива, АДХ
	* @return {void}
	*/
	init(mFuel, mDry, sMid, Jrel, MV, AV, CX, CY) {
		this.mFuel = mFuel
		this.mDry = mDry
		this.sMid = sMid
		this.Jrel = Jrel
		
		this.CX_mod = new Interp_2D()
		this.CY_mod = new Interp_2D()
		
		this.CX_mod.init(MV, AV, CX)
		this.CY_mod.init(MV, AV, CY)
	}
	/**
	* @description задать опорную точку траектории
	* @return {void}
	*/
	getKinematics(Vx, Vy, X, Y) {
		this.kinematics = [ Vx, Vy, X, Y, this.mFuel + this.mDry]
		const Vabs = Math.sqrt(Vx * Vx + Vy * Vy)
		const H = Math.sqrt(X * X + Y * Y) - RE
		const atmoEnv = activeAtmo.getAtmo(H)
		const Mach0 = Vabs / atmoEnv.aSn
		const alpha0 = 0
		
		this.CX_mod.setupIndices(Mach0, alpha0)
		this.CY_mod.setupIndices(Mach0, alpha0)
	}
	/**
	* @description задать закон управления в канале тангажа
	* @return {void}
	*/
	setupPitchControl(pitchFuncPtr) {
		this.alphaControl = pitchFuncPtr
	}
	/**
	* @description задать закон управления расходом горючего
	* @return {void}
	*/
	setupFuelControl(fuelFuncPtr) {
		this.fuelControl = fuelFuncPtr
	}
	/**
	* @description получить производные для ОДУ движения
	* @return {Array.<Number>}
	*/
	derivs(kinematics, t) {
		const Vx = kinematics[0]
		const Vy = kinematics[1]
		const X = kinematics[2]
		const Y = kinematics[3]
		const m = kinematics[4]
		
		const alpha = this.alphaControl(this, kinematics, t)
		const dFuel = this.fuelControl(this, kinematics, t)
		const V2 = Vx * Vx + Vy * Vy
		const radVect2 = X * X + Y * Y
		const radVectAbs = Math.sqrt(radVect2)
		const radVect3 = radVect2 * radVectAbs
		const Vabs = Math.sqrt(V2)
		const CTH = Vx / Vabs
		const STH = Vy / Vabs
		const H = radVectAbs - RE
		const atmoEnv = activeAtmo.getAtmo(H)
		const Mach = Vabs / atmoEnv.aSn
		const QS = 0.5 * atmoEnv.Ro * V2 * this.sMid
		const CA = Math.cos(alpha/57.3)
		const SA = Math.sin(alpha/57.3)
		this.CX_mod.checkArgs(Mach, alpha)
		this.CY_mod.checkArgs(Mach, alpha)
		
		const XA = this.CX_mod.interp(Mach, alpha) * QS
		const YA = this.CY_mod.interp(Mach, alpha) * QS
		const gravForce = - KE / radVect3
		const R = this.Jrel * dFuel
		const RXA = R * CA
		const RYA = R * SA
		
		return [
			gravForce * X + ( (RXA - XA) * CTH - (RYA + YA) * STH ) / m,
			gravForce * Y + ( (RXA - XA) * STH + (RYA + YA) * CTH ) / m,
			Vx,
			Vy,
			-dFuel
		]		
	}
	/**
	* @description ЧИ 2-го порядка до заданного момента времени
	* @param {Number} t0 начальный момент времени
	* @param {Function} finish условие полного окончания полета
	* @param {Function} stage условие разделение ступеней
	* @param {Number} dT шаг интегрирования
	* @return {result: Array.<{Number, Array.<Number>}>, nextStage: Boolean, finishflight: Boolean}
	*/
	integrate(t0, finish, stage, dT) {
		const result = [
			{t: t0, kinematics: this.kinematics }
		]

		let tau = t0
		let i = 0
		const dT_05 = dT * 0.5

		let finishFlight = finish(result[i])
		let nextStage = stage(result[i])
		let continueIntegrate = !(finishFlight || nextStage)
		
		activeAtmo.setupIndex(totalHeight(this.kinematics[2], this.kinematics[3])) // получили опорный индекс для интерполяции атомсферы
		
		while( continueIntegrate ) {
			const kinematics_0 = result[i++].kinematics
			const K0 = this.derivs(kinematics_0, tau)
			
			activeAtmo.checkIndex(totalHeight(kinematics_0[2], kinematics_0[3])) // уточнили актуальность атмосферы
			
			const kinematics_1 = [
				kinematics_0[0] + dT_05 * K0[0],
				kinematics_0[1] + dT_05 * K0[1],
				kinematics_0[2] + dT_05 * K0[2],
				kinematics_0[3] + dT_05 * K0[3],
				kinematics_0[4] + dT_05 * K0[4]
			]
			const K1 = this.derivs(kinematics_1, tau)
			
			tau += dT
			
			result.push({
				t: tau,
				kinematics: [
					kinematics_0[0] + dT * K1[0],
					kinematics_0[1] + dT * K1[1],
					kinematics_0[2] + dT * K1[2],
					kinematics_0[3] + dT * K1[3],
					kinematics_0[4] + dT * K1[4]
				]
			})
			
			nextStage = stage(result[i])
			finishFlight = finish(result[i])
			continueIntegrate = !(nextStage || finishFlight)
		}
		
		return { result, nextStage, finishFlight }
	}
}

module.exports = VehicleStage