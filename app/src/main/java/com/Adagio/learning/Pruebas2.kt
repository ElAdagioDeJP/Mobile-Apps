package com.Adagio.learning

fun main(){
    val diasSemana = arrayOf("Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo")
    println(diasSemana[0])
    diasSemana[0] = "Lunesito"
    for (i in diasSemana){
        println("Recorriendo el $i")
    }
}