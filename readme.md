# EN satMod.Pgrogram for trajectory estimation for multi-staged flight and launch vehicles

Program is based upon numerical integration of ordinary differential equations governing movements of material point in central gravity field (X - Y coordinates centered on spherical Earth, no side maneuvers). Atmosphere model (pressure, tempreature, density, speed of sound) is a standart GOST 4401-81 atmosphere 

## Purpose. What the program could do?

Main purpose of satMod is a estimation of launch vehicle capabilities that is more accurate then rought estimate based on characteristic dV (Tsiolkovsky speed) of each stage, corrected with characteristic speed losses due to aerodynamics, gravity and suboptimal engine performance in atmosphere. Also satMod can be used to research guided atmospheric flight (lifting reentry, Zenger-type skipping reentry). With more accurate model of upper atmosphere layers would be possible to calculate orbit decay of sattelites in LEO 

## How to use

Trajectory calculation script launches by executing __node launcher.js__ in console (bash, powershell, cmd). If folder ./data contains valid json with initial data, then after successfull calculation in console will appear short log with performance timing. Finally, csv file with trajectory calculation results would be created in root directory

## Initial data description

Initial data is a JSON file containing arrays initData, alpha_controls and fuel_controls. Length of these arrays is equal to number of stages in vehicle

Each element of initData contains information about vehicle stage performance (this includes payload/upper stage performance):

# RU satMod.Программа расчета траектории многоступенчатого ЛА

Программа основана на численном интегрировании уравнений движения материальной точки в поле центрального тяготения. Постановка задачи - двухмерная, движение происходит в плоскости X-Y без боковых маневров. Модель атмосферы (давление, температура, плотность, скорость звука) - Стандартная атомсфера ГОСТ 4401-81.

## Назначение программы

Основная задача satMod (в ее текущем состоянии) - оценка энергетических возможностей носителей более точно, чем то позволяет сумма характеристических скоростей "по Циолковскому" с учетом потерь на аэродинамику, гравитацию и нерасчетную работу двигателей носителя. Кроме того, satMod позволяет приближенно оценивать движение ЛА в атмосфере на всех этапах от входа до приземления - можно рассчитать продолжительность планирования, глиссирования и захода на посадку. Если уточнить модель верхних слоев атмосферы, то можно будет исследовать угасание орбит ИСЗ

## Способ применения

Расчет запускается через команду __node launcher.js__ в консоли (bash, powershell, cmd). Если в папке ./data имеется заполненный json с исходными данными, то при успешном выполнении расчета в консоли появляется краткий лог с указанием времени вычислений (в мс). Также формируется файл csv, содержащий базовые траекторные данные.

## Формат исходных данных

Исходные данные представляют собой JSON с массивами initData, alpha_controls и fuel_controls. Количество элементов в каждом массиве соответствует количеству ступеней ЛА.

Каждый элемент массива initData - блок исходных данных, описывающих отдельную ступень ЛА (в т.ч. полезную нагрузку ЛА). В каждом элементе initData содержатся:
	
1. Блок аэродинамических характеристик ADX, включающий:
	1. MV - Опорный вектор чисел M
	1. AV - Опорный вектор углов атаки
	1. CXMA - таблица коэффициентов лобового сопротивления для интерполяции по числам M и углам атаки
	1. CYMA - таблица коэффициентов подъемной силы для интерполяции по числам M и углам атаки
2. Блок массовых и геометрических характеристик massGeometry
	2. mDry - масса незаправленной ступени ЛА (кг)
	2. mFuel - запас топлива ступени (кг)
	2. sMid - характерная площадь ступени (мидель/крыло/корпус) (м2)
	2. jRel - удельный импульс ДУ ступени (актуально только для ЖРД/РДТТ) (м/с)
		
Каждый элемент массива alpha_controls - описание закона управления ступени в канале тангажа, состоит из полей:
	
1. types - тип закона управления, пока заданы 3 возможных разновидности:
	1. alpha_constant - полет при постоянном угле атаки (пример - глиссирование или полет с нулевым углом атаки, град)
	2. level_flight - полет с удержанием постоянного угла наклона траектории к местному горизонту (пример - горизонтальный полет или посадочная глиссада)
	3. ascend_profile - закон управления для вертикально стартующего ЛА с участком интенсивного маневрирования для заклонения траектории
2. prms - Параметры законов управления, для каждого закона управления специфичны
	1. alpha_constant (alpha_const - фиксированный угол атаки)
	2. level_flight (	alpha_base - базовый угол атаки, k_th - коэфф. чувствительност управления к углу наклона траектории, th_base - удерживаемый угол наклона траектории, v_dive - скорость перевода в пике, alpha_dive - угол атаки при пикировании, k_th_dive - коэфф. чувствительности при пикировании, th_dive - удерживаемый угол снижения в пике, alpha_max - максимально допустимый угол атаки )
	3. ascend_profile (maneuver_start - начало разворота(с), maneuver_end - окончание разворота(с), k2, k1 , k0 - коэффициенты параболы разворота , V_super - скорость начала разворота с малым фиксированным углом атаки (м/с), alpha_base - угол атаки после первого разворота, alpha_super - угол атаки при на большой скорости
		
Каждый элемент массива fuel_controls - описание закона управления расходом топлива, также состоит из полей type и prms.
	
1. types:
	1. dm_constant - постоянный расход топлива, параметр dm_regular - расход топлива (кг/с)
	2. dm_nodrain - ступень без двигателя, не расходующая топливо
		
## Формат результатов расчета

Результаты расчета записываются в csv файле, каждая строка файла - один шаг численного интегрирования. В настоящий момент записываются следующие параметры:
	
1. Время с момент взлета (с)
2. Скорость (м/с)
3. Угол наклона траектории к местном горизонту (град)
4. Высота над уровнем моря (м)
5. Пройденная по дуге дальность (м)
6. Масса ЛА
	
## TODO

- [x] Задавать законы разделения ступеней ЛА в шаблонной форме, как это сделано с законами управления тангажом и расходом топлива
- [ ] Настроить задание параметров среды (атмосфера, радиус, параметр гравитационного поля) через внешний файл
- [ ] Расширить выдачу программы (перегрузки по осям, скоростной напор, качество). Возможно, что создать аналитический модуль, совместно оценивающий траекторные параметры и характеристики ЛА
- [ ] Сформировать блок ИД для ЛА - легкой трехступенчатой РКН, выводящей КА на НОО (ориент. - 20 тонн, 100 кг, 500 км)
- [ ] Настраиваемая подача ИД через файл-конфигурацию
- [ ] Расширить законы управления (взлет с ВПП, снижение по глиссаде и посадка, маневр "горка")
- [ ] Модель ВРД (ТРД/ПВРД для первой ступени системы выведения)
- [ ] Диалоговый интерфейс для node (режимы расчета/аналитики/визуализации)
