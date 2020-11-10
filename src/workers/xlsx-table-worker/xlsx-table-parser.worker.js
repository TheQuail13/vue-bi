import XLSX from "xlsx";

addEventListener('message', event => { 
    let file = event.data.message;
    let reader = new FileReader();

    reader.onload = (e) => {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {
            type: "array",
            cellDates: true,
            cellText: false,
            sheetStubs: true,
        });

        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];

        // console.time("fileData");
        let tableData = XLSX.utils.sheet_to_json(worksheet, {
            header: 0,
            raw: false, // only for table display
            defval: "",
        });
        // console.timeEnd("fileData");

        postMessage(tableData)
    };
    
    reader.readAsArrayBuffer(file);
})