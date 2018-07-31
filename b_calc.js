(function () {
    let display = document.getElementById("calc_display");

    let numbers = (function (display) {
        //add number to display
        let appendNum = function (num) {
            display.value += num;
        };
        //make overflow numbers scrollable
        let showOverflow = function () {
            let idx = display.value.length;
            display.focus();
            display.setSelectionRange(idx, idx);
        };
        //clear display if last press was operator, then show numbers pressed
        let clickNum = function (num) {
            if (!operations.getCanCalc())
                deletes.clickDel("ce");
            appendNum(num);
            showOverflow();
            operations.unlockCalc();
        };

        return {
            clickNum: clickNum
        };
    })(display);

    let modifiers = (function (display) {
        let addDecimal = function () {
            //if display empty or canCalc false, set display to 0.
            if (!display.value || !operations.getCanCalc())
                display.value = "0";
            if (display.value.indexOf(".") === -1)
                display.value += ".";
        };

        let clickDecimal = function () {
            addDecimal();
            operations.unlockCalc();
        };
        //add a - if not there, remove it if there
        let clickPosNeg = function () {
            if (operations.getCanCalc()) {
                let entry = display.value;
                display.value = entry[0] === "-" ? entry.slice(1) : `-${entry}`;
            }
        };

        return {
            clickDecimal: clickDecimal,
            clickPosNeg: clickPosNeg
        };
    })(display);

    let deletes = (function (display) {
        //for Del btn, delete one num at a time
        let del = function () {
            let entry = display.value;
            display.value = entry.slice(0, -1);
        };
        //clear screen but not ops
        let ce = function () {
            display.value = "";
        };
        //clear screen and stored ops
        let c = function () {
            ce();
            operations.clearCalcs();
        };

        let clickDel = function (cbName) {
            switch (cbName) {
                case "del":
                    del();
                    break;
                case "ce":
                    ce();
                    break;
                case "c":
                    c();
                    break;
                default:
                    console.log(`${cbName} != del, c or ce`);
            }
            if (!display.value) operations.lockCalc();
        };

        return {
            clickDel: clickDel
        };
    })(display);
    //Math operations
    let operations = (function (display) {
        let canCalc = false; //tracks whether calc possible based on display content & keys pressed/clicked
        let calcs = []; //store values and operators for calculation
        //let outside functions read cancalc
        let getCanCalc = function () {
            return canCalc;
        };
        //clear all nums and operations
        let clearCalcs = function () {
            calcs = [];
        };
        //maybe allow calculation
        let unlockCalc = function () {
            canCalc = true;
        };
        //don't allow calculation
        let lockCalc = function () {
            canCalc = false;
        };
        //check if enough data to perform calculation
        let readyToCalc = function () {
            return canCalc && calcs.length === 2;
        };

        let add = function (x, y) {
            return x + y;
        };

        let minus = function (x, y) {
            return x - y;
        };

        let mult = function (x, y) {
            return x * y;
        };

        let divide = function (x, y) {
            return y === 0 ? "Does Not Compute" : x / y;
        };
        //figure out how many decimal places
        let setPrecision = function (x, y) {
            //good enough for add, mult & minus decimal nums
            let xStr = x.toString();
            let xDec = xStr.indexOf(".");
            let yStr = y.toString();
            let yDec = yStr.indexOf(".");
            let precision = 0;
            if (xDec !== -1)
                precision += xStr.length - 1 - xDec;
            if (yDec !== -1)
                precision += yStr.length - 1 - yDec;
            return precision;
        };
        //return the correct decimal number for add, mult, minus
        let precisionRound = function (num, precision) {
            let factor = Math.pow(10, precision);
            return Math.round(num * factor) / factor;
        };
        //perform the actual calculation
        let calculate = function () {
            let mathFn = calcs[0];
            let x = calcs[1];
            let y = parseFloat(display.value);
            let total = mathFn(x, y);
            if (!Number.isInteger(total) && typeof total !== "string") {
                total = mathFn === divide ? parseFloat(total.toFixed(15)) :
                    precisionRound(total, setPrecision(x, y));
            }
            console.log(`${x} ${mathFn} ${y} = ${total}`);
            return total;
        };
        //triggers when user clicks =
        let clickEquals = function () {
            if (readyToCalc()) {
                display.value = calculate();
                clearCalcs();
                lockCalc();
            }
        };
        //triggers when user clicks + - * /
        let clickOperate = function (op) {
            if (display.value) {
                if (readyToCalc())
                    display.value = calculate();
                calcs[1] = parseFloat(display.value);
                switch (op) {
                    case "add":
                        calcs[0] = add;
                        break;
                    case "minus":
                        calcs[0] = minus;
                        break;
                    case "mult":
                        calcs[0] = mult;
                        break;
                    case "divide":
                        calcs[0] = divide;
                }
            }
            lockCalc();
        };

        return {
            clickOperate: clickOperate,
            clickEquals: clickEquals,
            unlockCalc: unlockCalc,
            lockCalc: lockCalc,
            clearCalcs: clearCalcs,
            getCanCalc: getCanCalc
        };
    })(display);
    //Attach functions to key presses
    function kbInput(event) {
        let input = event.which || event.keyCode;
        if (!event.shiftKey && input > 47 && input < 58) {
            numbers.clickNum(String.fromCharCode(input));
        } else {
            input = event.key;
            switch (input) {
                case ".":
                    modifiers.clickDecimal();
                    break;
                case "Backspace":
                    deletes.clickDel("del");
                    break;
                case "p":
                    modifiers.clickPosNeg();
                    break;
                case "c":
                    deletes.clickDel("c");
                    break;
                case "=":
                case "+":
                    operations.clickOperate("add");
                    break;
                case "-":
                    operations.clickOperate("minus");
                    break;
                case "*":
                case "x":
                    operations.clickOperate("mult");
                    break;
                case "/":
                    operations.clickOperate("divide");
                    break;
                case "Enter":
                    operations.clickEquals();
            }
        }
    }
    //Attach all the key and click events to interface
    (function () {
        //attach to number buttons
        let numBtns = document.getElementsByClassName("numbers");
        for (let i = 0; i < numBtns.length; ++i) {
            numBtns[i].onclick = () => numbers.clickNum(numBtns[i].textContent.trim());
        }
        //attach to decimal button
        let decBtn = document.getElementById("decimal");
        decBtn.onclick = modifiers.clickDecimal;
        //attach to +/- button
        let pnBtn = document.getElementById("pos_neg");
        pnBtn.onclick = modifiers.clickPosNeg;
        //attach to DEL
        let delBtn = document.getElementById("del");
        delBtn.onclick = () => deletes.clickDel("del");
        //attach to CE
        let ceBtn = document.getElementById("ce");
        ceBtn.onclick = () => deletes.clickDel("ce");
        //attach to C
        let cBtn = document.getElementById("c");
        cBtn.onclick = () => deletes.clickDel("c");
        //attach to +
        let addBtn = document.getElementById("add");
        addBtn.onclick = () => operations.clickOperate("add");
        //attach to -
        let minusBtn = document.getElementById("minus");
        minusBtn.onclick = () => operations.clickOperate("minus");
        //attach to x 
        let multBtn = document.getElementById("mult");
        multBtn.onclick = () => operations.clickOperate("mult");
        //attach to /
        let divideBtn = document.getElementById("divide");
        divideBtn.onclick = () => operations.clickOperate("divide");
        //attach to =
        let equalsBtn = document.getElementById("equals");
        equalsBtn.onclick = () => operations.clickEquals();
        //attach keyboard events
        document.body.onkeydown = event => kbInput(event);
    })();

})();