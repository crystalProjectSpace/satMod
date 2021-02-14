'use strict'
// Стандартная атомсфера ГОСТ 4401-81
const atmoStandart = [
//	высота	  Температура()	 Давление(Па) Плотность(кг/м3) Скорость звука
	[0,			288.150,	 1.01325E+5,	 1.22500,	 341.15],
	[1000,		281.651,	 8.98763E+4,	 1.11166,	 337.28],
	[2000,		275.154,	 7.95014E+4,	 1.00655,	 333.368],
	[3000,		268.659,	 7.01212E+4,	 9.09254E-1, 329.41],
	[4000,		262.166,	 6.16604E+4,	 8.19347E-1, 325.405],
	[5000,		255.676,	 5.40483E+4,	 7.36429E-1, 321.352],
	[6000,		249.187,	 4.72176E+4,	 6.6011E-1,	 317.248],
	[8000,		236.215,	 3.56516E+4,	 5.25786E-1, 308.88],
	[10000, 	223.252,	 2.64999E+4,	 4.13510E-1, 300.285],
	[12000, 	216.650,	 1.93994E+4,	 3.11937E-1, 295.81],
	[15000, 	216.650,	 1.21118E+4,	 1.94755E-1, 295.81],
	[20000, 	216.650,	 5.52929E+3,	 8.89097E-2, 295.81],
	[25000, 	221.552,	 2.54921E+3,	 4.00837E-2, 299.14],
	[30000, 	226.509,	 1.19703E+3,	 1.84101E-2, 302.468],
	[35000, 	236.513,	 5.74592E+2,	 8.46334E-3, 309.075],
	[40000, 	250.350,	 2.87143E+2,	 3.99566E-3, 317.98],
	[50000, 	270.650,	 7.97787E+1,	 1.02687E-3, 330.628],
	[60000, 	247.021,	 2.19586E+1,	 3.09676E-4, 315.866],
	[65000, 	233.292,	 1.09297E+1,	 1.63209E-4, 306.963],
	[70000, 	219.585,	 5.22088,		 8.28284E-5, 297.809],
	[80000, 	198.639,	 1.05247,		 1.84580E-5, 283.249],
	[85000, 	188.894,	 4.45710E-1,	 8.22001E-6, 276.214],
	[90000, 	186.650,	 1.83140E-1,	 3.41817E-6, 274.568],
	[100000,	196.605,	 3.18606E-2,	 5.54951E-6, 281.795],
	[120000,	334.42,		 2.66618E-3,	 2.44041E-8, 367.521],
	[150000,	627.60,		 4.49233E-4,	 2.00329E-9, 503.475],
	[1000000,	1000,		 0,				 0,			 635.531],
	[10000000,	1000,		 0,				 0,			 635.531]
]
// объект-интерполятор
const Atmo = function() {
	this.atmoData = atmoStandart
	this.index = 0
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

const enviro = {
	KE: 0.39857128*1E+15,	// произведение грав.постоянной на массу Земли
	RE: 6.3711*1E+6,		// радиус Земли
	Atmo
}

module.exports = enviro