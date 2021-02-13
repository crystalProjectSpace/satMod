'use strict'

const enviro = {
	KE: 0.39857128*1E+15,	// произведение грав.постоянной на массу Земли
	RE: 6.3711*1E+6,		// радиус Земли
	Atmo: function(H){
		return {
			Ro: 1.205 * Math.exp(-H/7500),	// изотерм.атмосфера
			aSn: 305						// считаем, что скорость звука постоянна
		}
	}
}

module.exports = enviro