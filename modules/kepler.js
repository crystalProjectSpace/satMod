'use strict'
/**
* @description Класс динамика объекта на кеплеровской траектории. Нужен для управления ступенью выведения
* @property {Number} pAxis параметр полуоси орбиты
* @property {Number} excen эксцентриситет
* @property {Number} betha_0 начальный угол разворота
* @property {Number} ex_2 эксцентриситет в квадрате (для кэша)
* @property {Number} C1 коэффициенты при уравнении Ламберта ->
* @property {Number} C3
* @property {Number} tanTh0
* @property {Number} X_0 -> коэффициенты при уравнении Ламберта
* @property {Number} bPeri угол перицентра
* @property {Number} bApo угол апоцентра
*/
class KeplerObject {
	/**
	* @description статический метод для определения высоты
	* @param {Number} V скорость
	* @param {Number} H высота
	* @param {Number} Th угол наклона траектории к местному горизонту
	* @return {Number} высота точки апогея
	*/
	static getApo(V, H, Th) {
		const {KE} = global.ENVIRO
		
		const CTH = Math.cos(Th)
		const CTH_2 = CTH * CTH
		const NU_0 = V * V * H / KE
		
		const pAxis = NU_0 * H * CTH_2
		const excen = Math.sqrt(1 - NU_0 * (2 - NU_0) * CTH_2)
		
		return pAxis / (1 - excen)
	}
	/**
	* @description статический метод для определения параметров в ожидаемой точке апогея
	* @param {Number} V скорость
	* @param {Number} H высота
	* @param {Number} Th угол наклона траектории к местному горизонту
	* @return {{hApo: Number, vApo: Number, tauApo: Number}} высота и скорость в апогее, время достижения апогея
	*/
	static getCurrentOrb(V, H, Th) {
		const {KE} = global.ENVIRO
		
		const CTH = Math.cos(Th)
		const CTH_2 = CTH * CTH
		const NU_0 = V * V * H / KE
		
		const pAxis = NU_0 * H * CTH_2
		const excen = Math.sqrt(1 - NU_0 * (2 - NU_0) * CTH_2)
		const ex_2 = excen * excen
		
		const hApo = pAxis / (1 - excen)
		const vApo = Math.sqrt(KE * ((ex_2 - 1) / pAxis + 2 / hApo))
		
		const X0 = Math.acos((1 - NU_0) / excen)
		const X1 = Math.acos((1 -( vApo * vApo * hApo / KE) ) / excen)
		
		const C1 = Math.pow(pAxis, 1.5) / (Math.sqrt(KE) * (1 - ex_2))
		const C3 = 1 / Math.sqrt(1 - ex_2)
		console.log(C1, C3, X0, (1 -( vApo * vApo * hApo / KE) ) / excen)
		const tauApo = C1 * (C3 * (X0 - X1) + Math.tan(Th))
		
		return  {
			hApo,
			vApo,
			tauApo
		}
	}
	/**
	* @description конструктор
	*/
	constructor () {
		this.pAxis = 0
		this.excen = 0
		this.betha_0 = 0
		
		this.ex_2 = 0
		this.C1 = 0
		this.C3 = 0
		this.tanTh0 = 0
		this.X_0 = 0
		
		this.bPeri = 0
		this.bApog = 0		
	}
	/**
	* @description Получить параметры орбиты на основе текущей кинематики
	* @param {Number} V скорость в начальный момент
	* @param {Number} H высота от центра притяжения
	* @param {Number} Th угол наклона траектории к местному горизонту
	* @return {void}
	*/
	init(V, H, Th) {
		const {KE} = global.ENVIRO
		
		const CTH = Math.cos(Th)
		const CTH_2 = CTH * CTH
		const NU_0 = V * V * H / KE
		
		this.pAxis = NU_0 * H * CTH_2
		this.excen = Math.sqrt(1 - NU_0 * (2 - NU_0) * CTH_2)
		this.ex_2 = this.excen * this.excen
		this.betha_0 = Math.acos((H - this.pAxis)/(H * this.excen))
		
		this.C1 = Math.pow(this.pAxis, 1.5) / (Math.sqrt(KE) * (1 - this.ex_2))
		this.C3 = 1 / Math.sqrt(1 - this.ex_2)
		this.X_0 = Math.acos((1 - NU_0) / this.excen)
		this.tanTh0 = Math.tan(Th)
		
		this.bPeri = this.betha0 + Math.PI
		this.bApo = this.betha0
	}
	/**
	* @param {Number} betha угол разворота объекта относительно начальной позиции
	* @return {{V: Number, H: Number, Th: Number, tau: Number}} кинематические параметры в точке
	*/
	setToBetha(betha) {
		const {KE} = global.ENVIRO
		const descend = (betha > this.bApo && betha < this.bPeri) ? -1 : 1
		
		const hCurrent = this.pAxis / (1 - this.excen * Math.cos(this.betha0 - betha))
		const vCurrent = Math.sqrt(KE * ((this.ex_2 - 1) / this.pAxis + 2 / hCurrent))
		
		const upsilon = 2 - hCurrent * (1 - this.ex_2) / this.pAxis
		
		const ThCurrent = Math.acos(Math.sqrt(this.pAxis / (upsilon * hCurrent))) * descend
		const X1 = Math.acos((1 -( vCurrent * vCurrent * hCurrent / KE) ) / this.excen) * descend
		
		const tau = this.C1 * (this.C3 * (this.X_0 - X1) + this.tanTh0 - Math.tan(ThCurrent))
		
		return {
			V: vCurrent,
			H: hCurrent,
			Th: ThCurrent, 
			tau
		}
	}
}

module.exports = KeplerObject