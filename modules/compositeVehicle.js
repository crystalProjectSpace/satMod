'use strict'

const VehicleStage = require('./vehicleStage.js')

class CompositeVehicle {
	constructor() {
		this.stages = []
		this.stageMasses = []
		this.stageFunctions = []
		this.nStage = 0
		this.currentStage = 0
	}
	/**
	* @description получить баллистическую сводку для ИД
	*/
	setupVehicle(stageData, stageControls, stageFunctions) {
		this.nStage = stageData.length
		
		this.stageFunctions = stageFunctions
		
		this.stageMasses.length = this.nStage
		
		let m0_total = 0
		let mDry_total = 0
		
		for(let i = 0; i < this.nStage; i++) {
			const i0 = this.nStage - i - 1
			const {mDry, mFuel} = stageData[i0].massGeometry
			
			mDry_total = mDry + m0_total
			m0_total += (mDry + mFuel)
			
			this.stageMasses[i0] = {
				m0: mDry_total,
				m1: m0_total
			}
		}		
		
		this.stages = stageData.map((stage, i) => {
			const result = new VehicleStage()
			const {massGeometry, ADX} = stage
			const {alphaControls, fuelControls} = stageControls[i]
			
			result.init(
				massGeometry.mFuel,
				this.stageMasses[i].m1,
				massGeometry.sMid,
				massGeometry.jRel,
				ADX.MV,
				ADX.AV,
				ADX.CXMA,
				ADX.CYMA
			)
			
			result.setupPitchControl(alphaControls)
			result.setupFuelControl(fuelControls)
			
			return result
		})
	}
	/**
	* @description Задать кинематические параметры для ступени в момент ее включения
	*/
	setupStageKinematics(Vx, Vy, X, Y) {
		this.stages[this.currentStage].getKinematics(Vx, Vy, X, Y)
	}
	/**
	* @description Разделение ступеней
	*/
	changeStage(Vx, Vy, X, Y) {
		this.currentStage++
		this.setupStageKinematics(Vx, Vy, X, Y)
	}
	/**
	* @description Сквозной расчет всей траектории с учетом разделения ступеней
	* @param {Function}
	* @param {Array.<Number>}
	* @param {Number}
	* @return
	*/
	calcTrajectory(globalFlag, startConditions, dT) {
		let tau = 0
		let globalResult = []
		const conditions = {t: tau, kinemtics: startConditions}
		
		for(let i = 0; i < this.nStage; i++) {
			const {result, nextStage, finishFlight} = this.stage[i].integrate(
				tau,
				this.stageFunctions[i],
				globalFlag,
				dT
			)
			
			globalResults = globalResults.concat(result)
			const lastIndex = globalResults.length - 1
			
			if(!finishFlight) {
				const lastPoint = this.globalResult[lastIndex].kinematics
				tau = this.globalResult[lastIndex].tau
				
				const Vx = lastPoint[0]
				const Vy = lastPoint[1]
				const X = lastPoint[2]
				const Y = lastPoint[3]
				
				this.changeStage(Vx, Vy, X, Y)
			} else {
				break;
			}
		}
		
		return globalResult
	}
}

module.exports = CompositeVehicle