'use strict'
// Для Земли используется стандартная атомсфера ГОСТ 4401-81
// объект-интерполятор
const AtmoModel = function() {
	this.atmoData = null
	this.index = 0
	
	this.initAtmo = atmosphere => {
		this.atmoData = atmosphere
	}
	
	/**
	* @description Задать актуальный индекс для интерполяции высоты
	*/
	this.setupIndex = H0 => {
		while(this.atmoData[this.index + 1][0] < H0) {
			this.index++
		}
	}
	/**
	* @description проверить актуальность индекса
	*/		
	this.checkIndex = H => {
		if(H > this.atmoData[this.index + 1][0]) {
			this.index++
		} else if(H < this.atmoData[this.index][0]) {
			this.index--
		}
	}
	/**
	* @description Получить параметры атмосферы (плотность, температура, скорость звука, плотность)
	*/
	this.getAtmo = H => {
		const atmoH_0 = this.atmoData[this.index]
		const atmoH_1 = this.atmoData[this.index + 1]
		const hRel = (H - atmoH_0[0]) / (atmoH_1[0] - atmoH_0[0])
			
		return {
			P: atmoH_0[2] + (atmoH_1[2] - atmoH_0[2]) * hRel,
			T: atmoH_0[1] + (atmoH_1[1] - atmoH_0[1]) * hRel,
			aSn: atmoH_0[4] + (atmoH_1[4] - atmoH_0[4]) * hRel,
			Ro: atmoH_0[3] + (atmoH_1[3] - atmoH_0[3]) * hRel
		}
	}
}

module.exports = AtmoModel