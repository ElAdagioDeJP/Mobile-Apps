package com.Adagio.chambing.sintaxis

fun main(){
    showMyName("Pablo")
    println(resta(8,9))
    print("Semestrificador, coloque un mes y yo le digo si forma parte del primer o segundo semestre: ")
    probandoWhen(readLine()?.toIntOrNull() ?: 0)
    print("Cual es tu edad?: ")
    verificadorEdad()
}

fun showMyName(name:String){
    println("Me llamo $name")
}

fun resta(numberOne:Int, numberTwo: Int): Int{
    return numberOne - numberTwo
}

fun verificadorEdad(){
    var number = readLine()?.toIntOrNull() ?: 0
    if (number >= 18) {
        println("Eres mayor de edad y tienes $number")
    } else if (number >= 1 && number < 18) {
        println("Eres menor de edad y tienes $number")
    } else{
        println("Valor ingresado no valido")
    }
}

fun probandoWhen(mes:Int){
    when(mes){
        in 1..6 -> println("Primer Semestre")
        in 7..12 -> println("Segundo Semestre")
        !in 1..12 -> println("No es un semestre valido")
    }
}

