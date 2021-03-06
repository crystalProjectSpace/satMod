'use strict'

const {Interp_2D} = require('./interp.js')				// функции табличной интерполяции
const {totalHeight} = require('./trajectoryUtils.js')	// вычисление высоты из абс.координат
const { absV, crossProduct, vectByScal, vect2matrix, arbitRotation } = require('./vectorOps.js')
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
		this.size = 0		// характерная длина ступени
		this.kEmission = 0	// коэффициент черноты ступени

		this.CX_mod = null	//	интерполятор для CXa
		this.CY_mod = null	//	интерполятор для CYa

		this.tMECO = 0 // глобальное время выключения ДУ ступени
		
		this.alphaControl = null	// закон управления по углу атаки
		this.gammaControl = null	// закон управления по углу крена
		this.fuelControl = null		// закон управления расходом топлива
		this.stage = null // закон разделения ступеней
		
		this.kinematics = [ 0, 0, 0, 0, 0, 0, 0 ] // кинематические параметры (Vx, Vy, Vz, X, Y, Z, m)
	}
	/**
	* @description задать ИД по массам конструкции, топлива, АДХ
	* @return {void}
	*/
	init(mFuel, mDry, sMid, Jrel, size, kEmission, MV, AV, CX, CY) {
		this.mFuel = mFuel
		this.mDry = mDry
		this.sMid = sMid
		this.Jrel = Jrel

		this.size = size
		this.kEmission = kEmission
		
		this.CX_mod = new Interp_2D()
		this.CY_mod = new Interp_2D()
		
		this.CX_mod.init(MV, AV, CX)
		this.CY_mod.init(MV, AV, CY)
	}
	/**
	* @description задать опорную точку траектории
	* @return {void}
	*/
	getKinematics(Vx, Vy, Vz, X, Y, Z) {
		this.kinematics = [ Vx, Vy, Vz, X, Y, Z, this.mFuel + this.mDry]
		const Vabs = Math.sqrt(Vx * Vx + Vy * Vy + Vz * Vz)
		const H = Math.sqrt(X * X + Y * Y + Z * Z) - global.ENVIRO.RE
		const atmoEnv = global.ENVIRO.Atmo.getAtmo(H)
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
	* @description задать закон управления в канале крена
	* @return {void}
	*/
	setupRollControl(rollFuncPtr) {
		this.gammaControl = rollFuncPtr
	}
	/**
	* @description задать закон управления расходом горючего
	* @return {void}
	*/
	setupFuelControl(fuelFuncPtr) {
		this.fuelControl = fuelFuncPtr
	}
	/**
	* @description задать закон завершения ступени
	* @return {void}
	*/
	setupStageControl(stagePtr) {
		this.stage = stagePtr
	}
	/**
	* @description получить производные для ОДУ движения
	* @return {Array.<Number>}
	*/
	derivs(kinematics, t) {
		const Vx = kinematics[0]
		const Vy = kinematics[1]
		const Vz = kinematics[2]
		const X = kinematics[3]
		const Y = kinematics[4]
		const Z = kinematics[5]
		const m = kinematics[6]
		
		const alpha = this.alphaControl(this, kinematics, t)
		const gamma = this.gammaControl(this, kinematics, t)
		const dFuel = this.fuelControl(this, kinematics, t)

		if(dFuel === 0 && !this.tMECO) {
			this.tMECO = t
		}

		const V2 = Vx*Vx + Vy * Vy + Vz*Vz

		const radVect2 = X * X + Y * Y + Z * Z
		const radVectAbs = Math.sqrt(radVect2)
		const radVect3 = radVect2 * radVectAbs
		const Vabs = Math.sqrt(V2)
		const H = radVectAbs - global.ENVIRO.RE
		const atmoEnv = global.ENVIRO.Atmo.getAtmo(H)
		const Mach = Vabs / atmoEnv.aSn
		const QS = 0.5 * atmoEnv.Ro * V2 * this.sMid
		const CA = Math.cos(alpha/57.3)
		const SA = Math.sin(alpha/57.3)
		const CG = Math.cos(gamma/57.3)
		const SG = Math.sin(gamma/57.3)

		this.CX_mod.setupIndices(Mach, alpha)
		this.CY_mod.setupIndices(Mach, alpha)
		const XA = this.CX_mod.interp(Mach, alpha) * QS
		const YA = this.CY_mod.interp(Mach, alpha) * QS
		const gravForce = - global.ENVIRO.KE / radVect3

		const vNorm = [Vx / Vabs, Vy / Vabs, Vz / Vabs]

		const zLocal = crossProduct(vNorm, [X, Y, Z])
		const zLocalN = vectByScal(zLocal, 1 / absV(zLocal) )

		const [Y_x, Y_y, Y_z] = vect2matrix(arbitRotation(zLocalN, Math.PI * 0.5), vNorm)

		if(dFuel > 0) {
			const R = this.Jrel * dFuel
			const xSumm = R * CA - XA
			const ySumm = R * SA + YA
			
			return [
				gravForce * X + (xSumm * vNorm[0] + ySumm * (CG * Y_x + SG * zLocalN[0])) / m,
				gravForce * Y + (xSumm * vNorm[1] + ySumm * (CG * Y_y + SG * zLocalN[1])) / m,
				gravForce * Z + (xSumm * vNorm[2] + ySumm * (CG * Y_z + SG * zLocalN[2])) / m,
				Vx,
				Vy,
				Vz,
				-dFuel
			]	
		} else {
			return [
				gravForce * X + ( - XA * vNorm[0] + YA * (CG * Y_x + SG * zLocalN[0])) / m,
				gravForce * Y + ( - XA * vNorm[1] + YA * (CG * Y_y + SG * zLocalN[1])) / m,
				gravForce * Z + ( - XA * vNorm[2] + YA * (CG * Y_z + SG * zLocalN[2])) / m,
				Vx,
				Vy,
				Vz,
				0
			]	
		}
	}
	/**
	* @description ЧИ 2-го порядка до заданного момента времени
	* @param {Number} t0 начальный момент времени
	* @param {Function} finish условие полного окончания полета
	* @param {Number} dT шаг интегрирования
	* @return {result: Array.<{Number, Array.<Number>}>, nextStage: Boolean, finishflight: Boolean}
	*/
	integrate(t0, finish, dT) {
		const result = [
			{t: t0, kinematics: this.kinematics }
		]

		let tau = t0
		let i = 0
		const dT_05 = dT * 0.5

		let finishFlight = finish(result[i])
		let nextStage = this.stage(this, result[i].kinematics, tau)
		let continueIntegrate = !(finishFlight || nextStage)
		
		global.ENVIRO.Atmo.setupIndex(totalHeight(this.kinematics[3], this.kinematics[4], this.kinematics[5])) // получили опорный индекс для интерполяции атомсферы
		
		while( continueIntegrate ) {
			const kinematics_0 = result[i++].kinematics
			const K0 = this.derivs(kinematics_0, tau)

			global.ENVIRO.Atmo.checkIndex(
				totalHeight(kinematics_0[3], kinematics_0[4], kinematics_0[5])
			) // уточнили актуальность атмосферы
			const kinematics_1 = [
				kinematics_0[0] + dT_05 * K0[0],
				kinematics_0[1] + dT_05 * K0[1],
				kinematics_0[2] + dT_05 * K0[2],
				kinematics_0[3] + dT_05 * K0[3],
				kinematics_0[4] + dT_05 * K0[4],
				kinematics_0[5] + dT_05 * K0[5],
				kinematics_0[6] + dT_05 * K0[6]
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
					kinematics_0[4] + dT * K1[4],
					kinematics_0[5] + dT * K1[5],
					kinematics_0[6] + dT * K1[6]
				]
			})
			
			nextStage = this.stage(this, result[i].kinematics, result[i].t)
			finishFlight = finish(result[i])
			continueIntegrate = !(nextStage || finishFlight)
		}
		
		return { result, nextStage, finishFlight }
	}
}

module.exports = VehicleStage