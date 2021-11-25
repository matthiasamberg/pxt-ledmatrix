{
    let ledmatrix = LEDMatrix.create(DigitalPin.P0, 32, 8, LEDColorMode.GRB)
    ledmatrix.setColorAdjustment(true)
    ledmatrix.setMatrixLayout(FirstLEDPosition.topLeft, LEDDirection.vertically, LEDRowSetup.zigZag)
    ledmatrix.setBrightness(100)
    ledmatrix.setLEDColor(0, 0, LEDMatrix.rgb(255, 0, 0))
    ledmatrix.setLEDColor(1, 0, LEDMatrix.rgb(128, 0, 0))
    ledmatrix.setLEDColor(0, 1, LEDMatrix.rgb(0, 255, 0))
    ledmatrix.setLEDColor(0, 2, LEDMatrix.rgb(0, 0, 255))
    ledmatrix.setLEDColor(2, 0, LEDMatrix.rgb(255, 255, 0))
    ledmatrix.setLEDColor(2, 1, LEDMatrix.rgb(255, 0, 255))
    ledmatrix.setLEDColor(2, 2, LEDMatrix.rgb(0, 255, 255))
    ledmatrix.setLEDColor(3, 0, LEDMatrix.rgb(255, 100, 70))
    for (let index = 0; index <= 100; index++) {
        ledmatrix.setBrightness(100 - index)
        basic.pause(10)
    }
    basic.pause(5000)
    ledmatrix.clear()
    basic.pause(50000)

}