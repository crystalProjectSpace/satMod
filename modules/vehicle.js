'use strict'

const enviro = require('./enviro.js')
const interpolations = require('./interp.js')

const KE = enviro.KE
const RE = enviro.RE
const Atmo = enviro.Atmo

const Interp_2D = interpolations.Interp_2D

class VehicleStage {
	/**
	* @description описание ступени многоступенчатой РКН
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
	*/
	getKinematics(Vx, Vy, X, Y) {
		this.kinematics = [ Vx, Vy, X, Y, this.mFuel + this.mDry]
		const Vabs = Math.sqrt(Vx * Vx + Vy * Vy)
		const H = Math.sqrt(X * X + Y * Y) - RE
		const atmoEnv = Atmo(H)
		const Mach0 = Vabs / atmoEnv.aSn
		const alpha0 = 0
		
		this.CX_mod.setupIndices(Mach0, alpha0)
		this.CY_mod.setupIndices(Mach0, alpha0)
	}
	/**
	* @description задать закон управления в канале тангажа
	*/
	setupPitchControl(pitchFuncPtr) {
		this.alphaControl = pitchFuncPtr
	}
	/**
	* @description задать закон управления расходом горючего
	*/
	setupFuelControl(fuelFuncPtr) {
		this.fuelControl = fuelFuncPtr
	}
	/**
	* @description получить производные для ОДУ движения
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
		const atmoEnv = Atmo(H)
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
	*/
	integrate(t0, tMax, dT) {
		const result = [
			{t: t0, kinematics: this.kinematics }
		]
		
		let tau = t0
		let i = 0
		const dT_05 = dT * 0.5
		
		while(tau < tMax) {
			const kinematics_0 = result[i++].kinematics
			const K0 = this.derivs(kinematics_0, tau)
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
		}
		
		return result
	}
}

module.exports = VehicleStage