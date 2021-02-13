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
		
		this.CX_mod.checkArgs(Mach0, alpha0)
		this.CY_mod.checkArgs(Mach0, alpha0)
	}
	/**
	* @description получить производные для ОДУ движения
	*/
	derivs(t) {
		const Vx = this.kinematics[0]
		const Vy = this.kinematics[1]
		const X = this.kinematics[2]
		const Y = this.kinematics[3]
		const m = this.kinematics[4]
		
		const alpha = this.alphaControl(this, t)
		const dFuel = this.fuelControl(this, t)
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
		const CXA = this.CX_mod.interp(Mach, alpha)
		const CYA = this.CY_mod.interp(Mach, alpha)
		const gravForce = - KE / radVect3
		const R = this.Jrel * dFuel
		
		return [
			gravForce * X + (( -CXA * CTH - CYA * STH) * QS + R * CTH) / m,
			gravForce * Y + (( -CXA * STH + CYA * CTH) * QS + R * STH) / m,
			Vx,
			Vy,
			-dFuel
		]		
	}
}

module.exports = VehicleStage