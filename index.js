
// // // const pi = 3.14;
// // // console.log(pi)

// // // pi= 9
// // // console.log(pi)

// // // var a ="gh"
// // // console.log(a)
// // // var a =10
// // // console.log(a)

// // // let a = 10
// // // console.log(a)
// // // a = 20
// // // console.log(a)

// // // let a = "hell"
// // // console.log(a)

// // // // let a = 10;

// // // {
// // //     let a = 20
// // //     console.log(a)
// // // }
// // // console.log(a)
// // // console.log(a)
// // // let a;


// // // var a = 10;

// // // if(a == 20){
// // //     console.log("hello")
// // // }else{
// // //     let a = 20;
// // //     console.log(a)
// // // }
// // // console.log(a)

// // // var a = 1;

// // // if (true) {
// // //   var a = 2;

// // //   if (true) {
// // //     let a = 3;
// // //     console.log(a);
// // //   }

// // //   console.log(a);
// // // }

// // // console.log(a);

// // // if (true) {
// // //   var a = 10;
// // // }

// // // if (true) {
// // //   var a = 20;
// // // }

// // // {console.log(a);}
// // // var a = 1;

// // // if (true) {
// // // //   let a = 2;
// // //   console.log(a);
// // // }

// // // console.log(a);

// // var a = 10;
// // let b = 20;

// // if (true) {
// //   var a = 30;
// //   let b = 40;

// //   console.log(a);
// //   console.log(b);

// //   if (true) {
// //     let a = 50;
// //     var c = 60;

// //     console.log(a);
// //     console.log(b);
// //     console.log(c);
// //   }

// //   console.log(a);
// //   console.log(b);
// //   console.log(c);
// // }

// // console.log(a);
// // console.log(b);
// // console.log(c);

// // consoler.log(a)
// // let a = 10;
// // let fn = () => {
// //     console.log("hello");
// // }
// // fn();

// // function greet(name, callback) {
// //   console.log("Hello " + name);
// //   callback();
// // }

// // function sayBye() {
// //   console.log("Goodbye!");
// // }

// // greet("Suraj", sayBye);

// // setTimeout(hello, 2000);

// // function hello() {
// // //   console.log("Runs after 2 seconds");
// // // }

// // // setInterval(function () {
// // //   console.log("Hello");
// // // }, 1000);

// // var a = 10;
// // let b = 20;
// // const c = 30;

// // setTimeout(() => {
// //   console.log("1:", a);
// // }, 1000);

// // setTimeout(() => {
// //   console.log("2:", b);
// // }, 1000);

// // setTimeout(() => {
// //   console.log("3:", c);
// // }, 1000);

// // a = 100;
// // b = 200;

// // console.log("4:", a);
// // console.log("5:", b);
// // console.log("6:", c);

// var a = 5;
// let b = 10;
// const c = 15;

// setTimeout(() => {
//   a = a + 5;
//   b = b + 5;
//   console.log("1:", a, b, c);
// }, 1000); 

// console.log("2:", a, b, c);

// a = 20;
// b = 30;

// console.log("3:", a, b, c);

// var a = 1;
// let b = 2;
// const c = 3;

// setTimeout(() => {
//   console.log("1:", a, b, c);
// }, 1000);

// a = 10;

// setTimeout(() => {
//   b = 20;
//   console.log("2:", a, b, c);
// }, 500);

// console.log("3:", a, b, c);
console.log("A");

setTimeout(() => console.log("B"), 0);

console.log("C");

setTimeout(() => {
  console.log("D");z
  setTimeout(() => console.log("E"), 0);
}, 0);

console.log("F");

setTimeout(() => console.log("G"), 0);

console.log("H");