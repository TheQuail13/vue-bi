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

        let typeCheckData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let fileHeaders = typeCheckData[0];

        let fileData = XLSX.utils.sheet_to_json(worksheet, {
            header: 0,
            blankrows: true,
            defval: null,
        });

        postMessage({ headers: fileHeaders, typeCheckData: typeCheckData, fileData: fileData, fileName: file.name})
    };
    
    reader.readAsArrayBuffer(file);
})