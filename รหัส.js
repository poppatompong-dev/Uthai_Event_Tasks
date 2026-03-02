// code.gs
// =====================================================
// Uthai Event Calendar - Backend Functions (Google Apps Script)
// Version: 1.2.0
// Last Updated: 2026-03-02
// =====================================================
// CHANGELOG:
// v1.2.0 (2026-03-02)
//   - Added `updateMultipleDays` for bulk multi-field updates.
//   - Implemented fixed public holidays tracking in `addMonth`.
//   - Extended event entry schema with Time, Location, DressCode.
// v1.1.0 (2024-02-16)
//   - Added uploadFileAttachment() function for file uploads
//   - Added deleteFileAttachment() function for file deletion
//   - Added getFileInfo() function for file information
//   - Added ATTACHMENT_FOLDER_ID constant for Google Drive storage
//   - Updated default settings for Uthai Municipality
// v1.0.0 (Initial)
//   - Base calendar system with Google Sheets integration
// =====================================================

const SPREADSHEET_ID = '1ueZ0MqWB_EwDfQLC_nCne5NzBcDrfFBSMpUbBtPMeAc'; // Replace with your Google Sheet ID
const FOLDER_ID = '1P8bJNDgo75QnFzbfEuoB4wqGAu0qjTgl'; // Replace with your Google Drive Folder ID for logos
const ATTACHMENT_FOLDER_ID = '1R4z98vXcsBzaprY3yksXt7g0mwOari-s'; // Google Drive Folder สำหรับเก็บไฟล์แนบ
const TIME_ZONE = 'Asia/Bangkok';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ปฎิทินดำเนินงาน/นับวันราชการ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Settings sheet
  let sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['Key', 'Value']);
    sheet.appendRow(['schoolName', 'เทศบาลเมืองอุทัยธานี']);
    sheet.appendRow(['educationOffice', 'จังหวัดอุทัยธานี']);
    sheet.appendRow(['schoolLogo', '']);
  }

  // Users sheet
  sheet = ss.getSheetByName('Users');
  if (!sheet) {
    sheet = ss.insertSheet('Users');
    sheet.appendRow(['ID', 'Username', 'Password', 'Fullname']);
    sheet.appendRow([Date.now().toString(), 'admin', 'admin123', 'ผู้ดูแลระบบ']);
  }

  // Years sheet
  sheet = ss.getSheetByName('Years');
  if (!sheet) {
    sheet = ss.insertSheet('Years');
    sheet.appendRow(['ID', 'Name', 'StartDate', 'EndDate', 'IsCurrent']);
    const yearId = Date.now().toString();
    sheet.appendRow([yearId, '2567', '2024-05-16', '2025-03-31', true]);
  }

  // Months sheet
  sheet = ss.getSheetByName('Months');
  if (!sheet) {
    sheet = ss.insertSheet('Months');
    sheet.appendRow(['ID', 'YearID', 'Month', 'Name']);
    const yearsData = ss.getSheetByName('Years').getDataRange().getValues();
    const yearId = yearsData[1][0]; // First year ID
    sheet.appendRow([Date.now().toString(), yearId, '2024-05', 'พฤษภาคม 2567']);
    sheet.appendRow([Date.now().toString() + 1, yearId, '2024-06', 'มิถุนายน 2567']);
    sheet.appendRow([Date.now().toString() + 2, yearId, '2024-07', 'กรกฎาคม 2567']);
  }

  // Days sheet
  sheet = ss.getSheetByName('Days');
  if (!sheet) {
    sheet = ss.insertSheet('Days');
    sheet.appendRow(['ID', 'MonthID', 'Date', 'Entries']);
  }
}

function createSampleDays() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const monthsSheet = ss.getSheetByName('Months');
  const months = monthsSheet.getDataRange().getValues().slice(1).map(row => ({ id: row[0], month: row[2] }));
  const daysSheet = ss.getSheetByName('Days');
  daysSheet.clearContents();
  daysSheet.appendRow(['ID', 'MonthID', 'Date', 'Entries']);
  let days = [];

  // Sample for May 2024
  const monthMay = months.find(m => m.month === '2024-05');
  if (monthMay) {
    for (let i = 1; i <= 15; i++) {
      const dateStr = `2024-05-${i.toString().padStart(2, '0')}`;
      const entries = [{ id: (Date.now() + Math.random()).toString(), detail: 'ปิดราชการ', responsible: '' }];
      days.push([(Date.now() + i).toString(), monthMay.id, dateStr, JSON.stringify(entries)]);
    }
    for (let i = 16; i <= 31; i++) {
      const dateStr = `2024-05-${i.toString().padStart(2, '0')}`;
      const date = new Date(2024, 4, i);
      let detail = '';
      if (date.getDay() === 0) detail = 'วันอาทิตย์';
      else if (date.getDay() === 6) detail = 'วันเสาร์';
      const entries = detail ? [{ id: (Date.now() + Math.random()).toString(), detail: detail, responsible: '' }] : [];
      days.push([(Date.now() + i).toString(), monthMay.id, dateStr, JSON.stringify(entries)]);
    }
  }

  // Sample for June 2024
  const monthJune = months.find(m => m.month === '2024-06');
  if (monthJune) {
    for (let i = 1; i <= 30; i++) {
      const dateStr = `2024-06-${i.toString().padStart(2, '0')}`;
      const date = new Date(2024, 5, i);
      let detail = '';
      if (date.getDay() === 0) detail = 'วันอาทิตย์';
      else if (date.getDay() === 6) detail = 'วันเสาร์';
      const entries = detail ? [{ id: (Date.now() + Math.random()).toString(), detail: detail, responsible: '' }] : [];
      days.push([(Date.now() + i + 31).toString(), monthJune.id, dateStr, JSON.stringify(entries)]);
    }
  }

  // Append all days
  if (days.length > 0) {
    daysSheet.getRange(daysSheet.getLastRow() + 1, 1, days.length, 4).setValues(days);
  }
}

function getSettings() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    return { schoolName: 'เทศบาลเมืองอุทัยธานี', educationOffice: 'จังหวัดอุทัยธานี', schoolLogo: '' };
  }
  const values = sheet.getDataRange().getValues().slice(1);
  let settings = {};
  values.forEach(row => {
    settings[row[0]] = row[1];
  });
  return settings;
}

function addDaysForMonth(monthId, yearMonth) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const daysSheet = ss.getSheetByName('Days');

  // ดึงข้อมูล days ที่มีอยู่
  const existingDays = getDays().filter(d => d.monthId === monthId);
  let existingDaysMap = {};
  existingDays.forEach(day => {
    existingDaysMap[day.date] = day;
  });

  const [year, month] = yearMonth.split('-');
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  let newDays = [];

  // รายการวันหยุดประจำรัฐที่วันที่ตรงกันทุกปี (ด/ว)
  let fixedHolidays = {
    '01-01': 'หยุด(วันขึ้นปีใหม่)',
    '04-06': 'หยุด(วันจักรี)',
    '04-13': 'หยุด(วันสงกรานต์)',
    '04-14': 'หยุด(วันสงกรานต์)',
    '04-15': 'หยุด(วันสงกรานต์)',
    '05-01': 'หยุด(วันแรงงานแห่งชาติ)',
    '05-04': 'หยุด(วันฉัตรมงคล)',
    '06-03': 'หยุด(วันเฉลิมฯ พระราชินี)',
    '07-28': 'หยุด(วันเฉลิมฯ ร.10)',
    '08-12': 'หยุด(วันเฉลิมฯ พระบรมราชชนนีพันปีหลวง วันแม่แห่งชาติ)',
    '10-13': 'หยุด(วันนวมินทรมหาราช)',
    '10-23': 'หยุด(วันปิยมหาราช)',
    '12-05': 'หยุด(วันคล้ายวันพระบรมราชสมภพ ร.9 วันพ่อแห่งชาติ)',
    '12-10': 'หยุด(วันรัฐธรรมนูญ)',
    '12-31': 'หยุด(วันสิ้นปี)'
  };

  // วันหยุดเฉพาะกิจและวันหยุดทางจันทรคติ สำหรับปี 2569 (2026)
  if (year === '2026') {
    const holidays2026 = {
      '01-02': 'หยุด(วันหยุดทำการเพิ่มเป็นกรณีพิเศษ)',
      '03-03': 'หยุด(วันมาฆบูชา)',
      '05-31': 'หยุด(วันวิสาขบูชา)',
      '06-01': 'หยุด(วันหยุดชดเชยวันวิสาขบูชา)',
      '07-29': 'หยุด(วันอาสาฬหบูชา)',
      '07-30': 'หยุด(วันเข้าพรรษา)',
      '12-07': 'หยุด(วันหยุดชดเชย วันพ่อแห่งชาติ)'
    };
    fixedHolidays = { ...fixedHolidays, ...holidays2026 };
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    // ถ้ามีข้อมูลอยู่แล้วใช้ข้อมูลเดิม, ถ้าไม่มีสร้างใหม่
    if (existingDaysMap[dateStr]) {
      newDays.push(existingDaysMap[dateStr]);
    } else {
      const date = new Date(parseInt(year), parseInt(month) - 1, day);
      const dayOfWeek = date.getDay();
      let detail = '';

      const monthDayCheck = `${month}-${dayStr}`;

      if (fixedHolidays[monthDayCheck]) {
        detail = fixedHolidays[monthDayCheck];
      } else if (dayOfWeek === 0) {
        detail = 'วันอาทิตย์';
      } else if (dayOfWeek === 6) {
        detail = 'วันเสาร์';
      }

      newDays.push({
        id: (Date.now() + day).toString(),
        monthId: monthId,
        date: dateStr,
        entries: detail ? [{
          id: (Date.now() + Math.random()).toString(),
          detail: detail,
          responsible: '',
          time: '',
          location: '',
          dressCode: '',
          remark: '',
          attachments: []
        }] : []
      });
    }
  }

  // ลบ days เดิมของเดือนนี้
  const allDays = getDays().filter(d => d.monthId !== monthId);

  // รวม days ใหม่
  const updatedDays = [...allDays, ...newDays];

  // บันทึกทีเดียว
  saveDays(updatedDays);

  return { success: true, count: newDays.length };
}

function updateMultipleDays(dayIds, updates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const daysSheet = ss.getSheetByName('Days');

  // ดึงข้อมูล days ปัจจุบัน
  let allDays = getDays();
  let updatedCount = 0;

  // อัพเดทเฉพาะ days ที่เลือก
  dayIds.forEach(dayId => {
    const index = allDays.findIndex(d => d.id === dayId);
    if (index !== -1) {
      // ตรวจสอบว่ามี entry อยู่หรือไม่
      if (!allDays[index].entries || allDays[index].entries.length === 0) {
        allDays[index].entries = [{
          id: (Date.now() + Math.random()).toString(),
          detail: '',
          responsible: '',
          time: '',
          location: '',
          dressCode: '',
          remark: '',
          attachments: []
        }];
      }

      // อัพเดทข้อมูลลงใน entry แรก
      const currentEntry = allDays[index].entries[0];

      if (updates.detail !== undefined && updates.detail !== '') currentEntry.detail = updates.detail;
      if (updates.time !== undefined && updates.time !== '') currentEntry.time = updates.time;
      if (updates.location !== undefined && updates.location !== '') currentEntry.location = updates.location;
      if (updates.dressCode !== undefined && updates.dressCode !== '') currentEntry.dressCode = updates.dressCode;
      if (updates.responsible !== undefined && updates.responsible !== '') currentEntry.responsible = updates.responsible;
      if (updates.remark !== undefined && updates.remark !== '') currentEntry.remark = updates.remark;

      updatedCount++;
    }
  });

  // บันทึกทีเดียว
  saveDays(allDays);

  return { success: true, updatedCount: updatedCount };
}

function deleteMultipleDays(dayIds) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const daysSheet = ss.getSheetByName('Days');

  // กรองเอาเฉพาะ days ที่ไม่ต้องการลบ
  const allDays = getDays();
  const remainingDays = allDays.filter(day => !dayIds.includes(day.id));

  // บันทึกทีเดียว
  saveDays(remainingDays);

  return { success: true, deletedCount: dayIds.length };
}

// เพิ่มฟังก์ชันสำหรับเพิ่มเดือน
function addMonth(yearId, monthValue, monthName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const monthsSheet = ss.getSheetByName('Months');

  // ดึงข้อมูล months ปัจจุบัน
  const allMonths = getMonths();

  // ตรวจสอบว่ามีเดือนนี้อยู่แล้วหรือไม่
  const existingMonth = allMonths.find(m => m.month === monthValue && m.yearId === yearId);
  if (existingMonth) {
    return { success: false, message: 'เดือนนี้มีอยู่ในระบบแล้ว' };
  }

  // เพิ่มเดือนใหม่
  const newMonth = {
    id: Date.now().toString(),
    yearId: yearId,
    month: monthValue,
    name: monthName
  };

  const updatedMonths = [...allMonths, newMonth];
  saveMonths(updatedMonths);

  // เพิ่มวันใส่เดือนแบบอัตโนมัติทันที
  addDaysForMonth(newMonth.id, monthValue);

  return { success: true, month: newMonth };
}

// เพิ่มฟังก์ชันสำหรับลบเดือน
function deleteMonth(monthId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const monthsSheet = ss.getSheetByName('Months');
  const daysSheet = ss.getSheetByName('Days');

  // ดึงข้อมูลปัจจุบัน
  const allMonths = getMonths();
  const allDays = getDays();

  // ลบเดือนและ days ที่เกี่ยวข้อง
  const updatedMonths = allMonths.filter(m => m.id !== monthId);
  const updatedDays = allDays.filter(d => d.monthId !== monthId);

  // บันทึกทีเดียว
  saveMonths(updatedMonths);
  saveDays(updatedDays);

  return { success: true };
}

// เพิ่มฟังก์ชันสำหรับลบหลายเดือน
function deleteMultipleMonths(monthIds) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const monthsSheet = ss.getSheetByName('Months');
  const daysSheet = ss.getSheetByName('Days');

  // ดึงข้อมูลปัจจุบัน
  const allMonths = getMonths();
  const allDays = getDays();

  // ลบเดือนและ days ที่เกี่ยวข้อง
  const updatedMonths = allMonths.filter(m => !monthIds.includes(m.id));
  const updatedDays = allDays.filter(d => !monthIds.includes(d.monthId));

  // บันทึกทีเดียว
  saveMonths(updatedMonths);
  saveDays(updatedDays);

  return { success: true, deletedCount: monthIds.length };
}

function saveSettings(settings) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return;
  if (settings.schoolLogo && settings.schoolLogo.startsWith('data:')) {
    settings.schoolLogo = uploadLogo(settings.schoolLogo);
  }

  sheet.clearContents();
  sheet.appendRow(['Key', 'Value']);
  Object.entries(settings).forEach(([key, value]) => {
    sheet.appendRow([key, value]);
  });
}

function uploadLogo(base64) {
  const [, data] = base64.split(',');
  const contentType = base64.split(';')[0].split(':')[1];
  const extension = contentType.split('/')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(data), contentType, `school_logo.${extension}`);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return `https://lh3.googleusercontent.com/d/${file.getId()}`;
}

// File Attachment Functions
function uploadFileAttachment(base64Data, fileName, contentType) {
  try {
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    const decodedData = Utilities.base64Decode(base64Data);
    if (decodedData.length > 5 * 1024 * 1024) {
      return { success: false, error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' };
    }

    // สร้าง blob จาก base64
    const blob = Utilities.newBlob(decodedData, contentType, fileName);

    // อัปโหลดไปยัง Google Drive
    const folder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID);
    const file = folder.createFile(blob);

    // ตั้งค่าให้ทุกคนที่มีลิงก์สามารถดูได้
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: `https://drive.google.com/file/d/${file.getId()}/view`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.getId()}`
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteFileAttachment(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getFileInfo(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: `https://drive.google.com/file/d/${file.getId()}/view`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.getId()}`
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getUsers() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues().slice(1);
  return values.map(row => ({
    id: row[0].toString(),
    username: row[1],
    password: row[2],
    fullname: row[3]
  }));
}

function saveUsers(users) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  if (!sheet) return;
  sheet.clearContents();
  sheet.appendRow(['ID', 'Username', 'Password', 'Fullname']);
  users.forEach(user => {
    sheet.appendRow([user.id, user.username, user.password, user.fullname]);
  });
}

function getYears() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Years');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues().slice(1);
  return values.map(row => ({
    id: row[0].toString(),
    name: row[1].toString(), // ✅ แปลงเป็น string เสมอ
    startDate: row[2] instanceof Date ? Utilities.formatDate(row[2], TIME_ZONE, 'yyyy-MM-dd') : row[2],
    endDate: row[3] instanceof Date ? Utilities.formatDate(row[3], TIME_ZONE, 'yyyy-MM-dd') : row[3],
    isCurrent: row[4]
  }));
}

function saveYears(years) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Years');
  if (!sheet) return;
  sheet.clearContents();
  sheet.appendRow(['ID', 'Name', 'StartDate', 'EndDate', 'IsCurrent']);
  years.forEach(year => {
    sheet.appendRow([year.id, year.name, year.startDate, year.endDate, year.isCurrent]);
  });
}

function getMonths() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Months');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues().slice(1);

  const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const monthsData = values.map(row => {
    let nameValue = row[3];
    if (row[2] instanceof Date) {
      const monthIndex = row[2].getMonth(); // 0–11
      const year = row[2].getFullYear() + 543; // แปลงเป็น พ.ศ.
      nameValue = `${monthsThai[monthIndex]} ${year}`; // เช่น "พฤษภาคม 2567"
    } else if (!row[3]) {
      nameValue = ''; // กรณีไม่มีค่า
    }

    return {
      id: row[0].toString(),
      yearId: row[1].toString(),
      month: row[2] instanceof Date
        ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), 'yyyy-MM')
        : row[2],
      name: nameValue.toString()
    };
  });

  // เรียงลำดับตามเดือน-ปี (จากเก่าที่สุดไปใหม่ที่สุด)
  return monthsData.sort((a, b) => a.month.localeCompare(b.month));
}


function saveMonths(months) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Months');
  if (!sheet) return;

  // ลบข้อมูลเก่าและเพิ่มใหม่ทีเดียว
  sheet.clearContents();
  sheet.appendRow(['ID', 'YearID', 'Month', 'Name']);

  if (months.length > 0) {
    const data = months.map(month => [
      month.id,
      month.yearId,
      month.month,
      month.name
    ]);

    // เพิ่มข้อมูลทีเดียวทั้งหมด
    sheet.getRange(2, 1, data.length, 4).setValues(data);
  }
}


function updateDay(dayData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const daysSheet = ss.getSheetByName('Days');

  // ดึงข้อมูล days ปัจจุบัน
  let allDays = getDays();
  const index = allDays.findIndex(d => d.id === dayData.id);

  if (index !== -1) {
    // อัพเดทข้อมูลวัน
    allDays[index] = dayData;
  } else {
    // เพิ่มวันใหม่
    allDays.push(dayData);
  }

  // บันทึกทีเดียว
  saveDays(allDays);

  return { success: true };
}

function deleteDay(dayId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const daysSheet = ss.getSheetByName('Days');

  // กรองเอาเฉพาะ days ที่ไม่ต้องการลบ
  const allDays = getDays();
  const remainingDays = allDays.filter(day => day.id !== dayId);

  // บันทึกทีเดียว
  saveDays(remainingDays);

  return { success: true };
}


function getDays() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Days');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues().slice(1);
  return values.map(row => ({
    id: row[0].toString(),
    monthId: row[1].toString(),
    date: row[2] instanceof Date ? Utilities.formatDate(row[2], TIME_ZONE, 'yyyy-MM-dd') : row[2],
    entries: JSON.parse(row[3] || '[]')
  }));
}

function saveDays(days) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Days');
  if (!sheet) return;

  // ลบข้อมูลเก่าและเพิ่มใหม่ทีเดียว
  sheet.clearContents();
  sheet.appendRow(['ID', 'MonthID', 'Date', 'Entries']);

  if (days.length > 0) {
    const data = days.map(day => [
      day.id,
      day.monthId,
      day.date,
      JSON.stringify(day.entries || [])
    ]);

    // เพิ่มข้อมูลทีเดียวทั้งหมด
    sheet.getRange(2, 1, data.length, 4).setValues(data);
  }
}

function getThailandHolidays(startDate, endDate) {
  try {
    const calendarId = 'th.th#holiday@group.v.calendar.google.com';
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) return {};

    const events = calendar.getEvents(new Date(startDate), new Date(endDate));
    const holidays = {};
    events.forEach(event => {
      const dateStr = Utilities.formatDate(event.getStartTime(), TIME_ZONE, 'yyyy-MM-dd');
      holidays[dateStr] = event.getTitle();
    });
    return holidays;
  } catch (e) {
    console.error('Error fetching holidays:', e);
    return {};
  }
}

function smartAddNextYear() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const years = getYears();

  // หาปีล่าสุด
  let latestYearInt = 2567; // Default
  if (years.length > 0) {
    latestYearInt = Math.max(...years.map(y => parseInt(y.name)));
  }

  const nextYearInt = latestYearInt + 1;
  const nextYearName = nextYearInt.toString();
  const nextYearId = Date.now().toString();

  // ปีงบประมาณไทย เริ่ม ต.ค. (ปีก่อนหน้า) สิ้นสุด ก.ย. (ปีปัจจุบัน)
  // เช่น ปีงบ 2568 เริ่ม ต.ค. 2567 (2024) สิ้นสุด ก.ย. 2568 (2025)
  const christianYearEnd = nextYearInt - 543;
  const christianYearStart = christianYearEnd - 1;

  const startDate = `${christianYearStart}-10-01`;
  const endDate = `${christianYearEnd}-09-30`;

  // 1. เพิ่มปี
  const newYear = {
    id: nextYearId,
    name: nextYearName,
    startDate: startDate,
    endDate: endDate,
    isCurrent: false
  };

  const updatedYears = [...years, newYear];
  saveYears(updatedYears);

  // 2. เพิ่มเดือน (12 เดือน)
  const monthsData = [];
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const startM = new Date(christianYearStart, 9, 1); // Oct
  const allMonths = getMonths();
  let baseId = Date.now();

  for (let i = 0; i < 12; i++) {
    const currentMonthDate = new Date(christianYearStart, 9 + i, 1);
    const monthValue = Utilities.formatDate(currentMonthDate, TIME_ZONE, 'yyyy-MM');
    const mIdx = currentMonthDate.getMonth();
    const yThai = currentMonthDate.getFullYear() + 543;

    monthsData.push({
      id: (baseId + i).toString(),
      yearId: nextYearId,
      month: monthValue,
      name: `${thaiMonths[mIdx]} ${yThai}`
    });
  }

  const updatedMonths = [...allMonths, ...monthsData];
  saveMonths(updatedMonths);

  // 3. เพิ่มวัน (ทุกวันในทุกเดือน) พร้อมดึงวันหยุด
  const holidays = getThailandHolidays(startDate, endDate);
  const allDays = getDays();
  const newDays = [];

  monthsData.forEach((m, idx) => {
    const [y, mm] = m.month.split('-');
    const daysInMonth = new Date(parseInt(y), parseInt(mm), 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${mm}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(parseInt(y), parseInt(mm) - 1, d);
      const dayOfWeek = dateObj.getDay();

      let detail = '';
      if (holidays[dateStr]) {
        detail = holidays[dateStr];
      } else if (dayOfWeek === 0) {
        detail = 'วันอาทิตย์';
      } else if (dayOfWeek === 6) {
        detail = 'วันเสาร์';
      }

      newDays.push({
        id: (baseId + 100 + (idx * 31) + d).toString(),
        monthId: m.id,
        date: dateStr,
        entries: detail ? [{
          id: (baseId + 2000 + (idx * 31) + d).toString(),
          detail: detail,
          responsible: ''
        }] : []
      });
    }
  });

  const updatedDaysFiltered = [...allDays, ...newDays];
  saveDays(updatedDaysFiltered);

  return { success: true, yearName: nextYearName };
}

// =====================================================
// AI Integration Functions (Gemini AI)
// =====================================================

// =====================================================
// End of file
// =====================================================
