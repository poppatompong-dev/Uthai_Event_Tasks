'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ImportType = 'daily' | 'weekly' | 'monthly' | 'multi-month' | 'yearly';

interface HolidayPreset {
    date: string;
    name: string;
    source: string;
    sourceUrl?: string;
}

// Thai public holidays 2568 (from กรม / มติ ครม.)
// อ้างอิง: มติ ครม. 28 พฤษภาคม 2567, สำนักเลขาธิการคณะรัฐมนตรี
const THAI_HOLIDAYS_2568: HolidayPreset[] = [
    { date: '2025-01-01', name: 'วันขึ้นปีใหม่', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-02-12', name: 'วันมาฆบูชา', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-04-06', name: 'วันจักรี', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-04-13', name: 'วันสงกรานต์', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-04-14', name: 'วันสงกรานต์', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-04-15', name: 'วันสงกรานต์', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-05-01', name: 'วันแรงงานแห่งชาติ', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-05-04', name: 'วันฉัตรมงคล', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-05-12', name: 'วันวิสาขบูชา', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-06-03', name: 'วันเฉลิมฯ สมเด็จพระนางเจ้าฯ พระบรมราชินี', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-07-10', name: 'วันอาสาฬหบูชา', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-07-11', name: 'วันเข้าพรรษา', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-07-28', name: 'วันเฉลิมฯ ร.10', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-08-12', name: 'วันเฉลิมฯ สมเด็จพระบรมราชชนนีพันปีหลวง', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-10-13', name: 'วันคล้ายวันสวรรคต ร.9', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-10-23', name: 'วันปิยมหาราช', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-12-05', name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-12-10', name: 'วันรัฐธรรมนูญ', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2025-12-31', name: 'วันสิ้นปี', source: 'มติ ครม. 28 พ.ค. 67', sourceUrl: 'https://www.cgd.go.th' },
];

// Holidays for year 2026 (พ.ศ. 2569)
const THAI_HOLIDAYS_2569: HolidayPreset[] = [
    { date: '2026-01-01', name: 'วันขึ้นปีใหม่', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-01-02', name: 'วันหยุดชดเชยวันขึ้นปีใหม่', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-03-01', name: 'วันมาฆบูชา', source: 'ปฏิทินจันทรคติ 2569', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2026-04-06', name: 'วันจักรี', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-04-13', name: 'วันสงกรานต์', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-04-14', name: 'วันสงกรานต์', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-04-15', name: 'วันสงกรานต์', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-05-01', name: 'วันแรงงานแห่งชาติ', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-05-04', name: 'วันฉัตรมงคล', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-05-20', name: 'วันวิสาขบูชา', source: 'ปฏิทินจันทรคติ 2569', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2026-06-03', name: 'วันเฉลิมฯ สมเด็จพระนางเจ้าฯ พระบรมราชินี', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-07-18', name: 'วันอาสาฬหบูชา', source: 'ปฏิทินจันทรคติ 2569', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2026-07-19', name: 'วันเข้าพรรษา', source: 'ปฏิทินจันทรคติ 2569', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2026-07-28', name: 'วันเฉลิมฯ ร.10', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-08-12', name: 'วันเฉลิมฯ สมเด็จพระบรมราชชนนีพันปีหลวง', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-10-13', name: 'วันคล้ายวันสวรรคต ร.9', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-10-23', name: 'วันปิยมหาราช', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-12-05', name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-12-10', name: 'วันรัฐธรรมนูญ', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
    { date: '2026-12-31', name: 'วันสิ้นปี', source: 'คาดการณ์ 2569', sourceUrl: 'https://www.soc.go.th' },
];

// Holidays for year 2027 (พ.ศ. 2570)
const THAI_HOLIDAYS_2570: HolidayPreset[] = [
    { date: '2027-01-01', name: 'วันขึ้นปีใหม่', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-02-18', name: 'วันมาฆบูชา', source: 'ปฏิทินจันทรคติ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-04-06', name: 'วันจักรี', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-04-13', name: 'วันสงกรานต์', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-04-14', name: 'วันสงกรานต์', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-04-15', name: 'วันสงกรานต์', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-05-01', name: 'วันแรงงานแห่งชาติ', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-05-04', name: 'วันฉัตรมงคล', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-05-09', name: 'วันวิสาขบูชา', source: 'ปฏิทินจันทรคติ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-06-03', name: 'วันเฉลิมฯ สมเด็จพระนางเจ้าฯ พระบรมราชินี', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-07-07', name: 'วันอาสาฬหบูชา', source: 'ปฏิทินจันทรคติ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-07-08', name: 'วันเข้าพรรษา', source: 'ปฏิทินจันทรคติ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-07-28', name: 'วันเฉลิมฯ ร.10', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-08-12', name: 'วันเฉลิมฯ สมเด็จพระบรมราชชนนีพันปีหลวง', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-10-13', name: 'วันคล้ายวันสวรรคต ร.9', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-10-23', name: 'วันปิยมหาราช', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-12-05', name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-12-10', name: 'วันรัฐธรรมนูญ', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2027-12-31', name: 'วันสิ้นปี', source: 'คาดการณ์ 2570', sourceUrl: 'https://www.cgd.go.th' },
];

// Holidays for year 2028 (พ.ศ. 2571)
const THAI_HOLIDAYS_2571: HolidayPreset[] = [
    { date: '2028-01-01', name: 'วันขึ้นปีใหม่', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-03-07', name: 'วันมาฆบูชา', source: 'ปฏิทินจันทรคติ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-04-06', name: 'วันจักรี', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-04-13', name: 'วันสงกรานต์', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-04-14', name: 'วันสงกรานต์', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-04-15', name: 'วันสงกรานต์', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-05-01', name: 'วันแรงงานแห่งชาติ', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-05-04', name: 'วันฉัตรมงคล', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-05-28', name: 'วันวิสาขบูชา', source: 'ปฏิทินจันทรคติ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-06-03', name: 'วันเฉลิมฯ สมเด็จพระนางเจ้าฯ พระบรมราชินี', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-07-26', name: 'วันอาสาฬหบูชา', source: 'ปฏิทินจันทรคติ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-07-27', name: 'วันเข้าพรรษา', source: 'ปฏิทินจันทรคติ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-07-28', name: 'วันเฉลิมฯ ร.10', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-08-12', name: 'วันเฉลิมฯ สมเด็จพระบรมราชชนนีพันปีหลวง', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-10-13', name: 'วันคล้ายวันสวรรคต ร.9', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-10-23', name: 'วันปิยมหาราช', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-12-05', name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-12-10', name: 'วันรัฐธรรมนูญ', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2028-12-31', name: 'วันสิ้นปี', source: 'คาดการณ์ 2571', sourceUrl: 'https://www.cgd.go.th' },
];

// Holidays for year 2029 (พ.ศ. 2572)
const THAI_HOLIDAYS_2572: HolidayPreset[] = [
    { date: '2029-01-01', name: 'วันขึ้นปีใหม่', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-02-24', name: 'วันมาฆบูชา', source: 'ปฏิทินจันทรคติ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-04-06', name: 'วันจักรี', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-04-13', name: 'วันสงกรานต์', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-04-14', name: 'วันสงกรานต์', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-04-15', name: 'วันสงกรานต์', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-05-01', name: 'วันแรงงานแห่งชาติ', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-05-04', name: 'วันฉัตรมงคล', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-05-17', name: 'วันวิสาขบูชา', source: 'ปฏิทินจันทรคติ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-06-03', name: 'วันเฉลิมฯ สมเด็จพระนางเจ้าฯ พระบรมราชินี', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-07-15', name: 'วันอาสาฬหบูชา', source: 'ปฏิทินจันทรคติ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-07-16', name: 'วันเข้าพรรษา', source: 'ปฏิทินจันทรคติ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-07-28', name: 'วันเฉลิมฯ ร.10', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-08-12', name: 'วันเฉลิมฯ สมเด็จพระบรมราชชนนีพันปีหลวง', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-10-13', name: 'วันคล้ายวันสวรรคต ร.9', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-10-23', name: 'วันปิยมหาราช', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-12-05', name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันชาติ / วันพ่อแห่งชาติ', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-12-10', name: 'วันรัฐธรรมนูญ', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
    { date: '2029-12-31', name: 'วันสิ้นปี', source: 'คาดการณ์ 2572', sourceUrl: 'https://www.cgd.go.th' },
];

// รวมวันหยุดทั้งหมด 2568-2572
const ALL_HOLIDAYS = [
    ...THAI_HOLIDAYS_2568,
    ...THAI_HOLIDAYS_2569,
    ...THAI_HOLIDAYS_2570,
    ...THAI_HOLIDAYS_2571,
    ...THAI_HOLIDAYS_2572
];

// แหล่งอ้างอิงอย่างเป็นทางการ
const OFFICIAL_SOURCES = [
    {
        name: 'มติคณะรัฐมนตรี (ครม.)',
        description: 'ประกาศวันหยุดราชการประจำปี',
        url: 'https://www.soc.go.th',
    },
    {
        name: 'สำนักเลขาธิการคณะรัฐมนตรี (สลค.)',
        description: 'หน่วยงานกำกับดูแลมติ ครม.',
        url: 'https://www.soc.go.th',
    },
    {
        name: 'กรมบัญชีกลาง กระทรวงการคลัง',
        description: 'ประกาศวันหยุดราชการและการเบิกจ่าย',
        url: 'https://www.cgd.go.th',
    },
    {
        name: 'สำนักงาน ก.พ.',
        description: 'หลักเกณฑ์การลาหยุดราชการ',
        url: 'https://www.ocsc.go.th',
    },
];

export default function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
    const { months, selectedYear, refreshData, days, years } = useApp();
    const [importType, setImportType] = useState<ImportType>('monthly');
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [includeWeekends, setIncludeWeekends] = useState(true);
    const [includeHolidays, setIncludeHolidays] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number; skipped: number } | null>(null);
    const [previewData, setPreviewData] = useState<{ date: string; detail: string; source?: string }[]>([]);
    const [showSources, setShowSources] = useState(false);

    const yearMonths = months.filter((m) => m.yearId === selectedYear);
    const currentYearData = years.find(y => y.id === selectedYear);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setResult(null);
            setPreviewData([]);
        }
    }, [isOpen]);

    const handleMonthToggle = (monthId: string) => {
        setSelectedMonths(prev =>
            prev.includes(monthId)
                ? prev.filter(m => m !== monthId)
                : [...prev, monthId]
        );
    };

    const selectAllMonths = () => {
        setSelectedMonths(yearMonths.map(m => m.id));
    };

    const clearAllMonths = () => {
        setSelectedMonths([]);
    };

    // Check if day already exists
    const dayExists = (monthId: string, dateStr: string): boolean => {
        return days.some(d => d.monthId === monthId && d.date === dateStr);
    };

    // Preview the import
    const handlePreview = () => {
        const preview: { date: string; detail: string; source?: string }[] = [];

        if (importType === 'monthly' || importType === 'multi-month') {
            for (const monthId of selectedMonths) {
                const month = yearMonths.find(m => m.id === monthId);
                if (!month) continue;

                const [year, monthNum] = month.month.split('-');
                const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1, day);
                    const dayOfWeek = date.getDay();

                    // Skip if already exists
                    if (dayExists(monthId, dateStr)) continue;

                    let detail = '';
                    let source = '';

                    // Check for holidays
                    if (includeHolidays) {
                        const holiday = ALL_HOLIDAYS.find(h => h.date === dateStr);
                        if (holiday) {
                            detail = `${holiday.name}`;
                            source = holiday.source;
                        }
                    }

                    // Add weekend marking
                    if (includeWeekends && !detail) {
                        if (dayOfWeek === 0) {
                            detail = 'วันอาทิตย์';
                        } else if (dayOfWeek === 6) {
                            detail = 'วันเสาร์';
                        }
                    }

                    if (detail) {
                        preview.push({ date: dateStr, detail, source });
                    }
                }
            }
        } else if (importType === 'daily' || importType === 'weekly') {
            if (!startDate || !endDate) return;

            const start = new Date(startDate);
            const end = new Date(endDate);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const dayOfWeek = d.getDay();

                // Find the month this date belongs to
                const [year, month] = dateStr.split('-');
                const monthValue = `${year}-${month}`;
                const targetMonth = yearMonths.find(m => m.month === monthValue);

                if (!targetMonth) continue;
                if (dayExists(targetMonth.id, dateStr)) continue;

                let detail = '';
                let source = '';

                // Check for holidays
                if (includeHolidays) {
                    const holiday = ALL_HOLIDAYS.find(h => h.date === dateStr);
                    if (holiday) {
                        detail = `${holiday.name}`;
                        source = holiday.source;
                    }
                }

                // Add weekend marking
                if (includeWeekends && !detail) {
                    if (dayOfWeek === 0) {
                        detail = 'วันอาทิตย์';
                    } else if (dayOfWeek === 6) {
                        detail = 'วันเสาร์';
                    }
                }

                if (detail) {
                    preview.push({ date: dateStr, detail, source });
                }
            }
        }

        setPreviewData(preview);
    };

    const generateDays = async () => {
        setIsLoading(true);
        setResult(null);
        let success = 0;
        let failed = 0;
        let skipped = 0;

        try {
            const daysToCreate: { monthId: string; date: string; detail: string }[] = [];

            // Get date range based on selected months or date inputs
            if (importType === 'monthly' || importType === 'multi-month') {
                for (const monthId of selectedMonths) {
                    const month = yearMonths.find(m => m.id === monthId);
                    if (!month) continue;

                    const [year, monthNum] = month.month.split('-');
                    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();

                    for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
                        const date = new Date(parseInt(year), parseInt(monthNum) - 1, day);
                        const dayOfWeek = date.getDay();

                        // Skip if already exists
                        if (dayExists(monthId, dateStr)) {
                            skipped++;
                            continue;
                        }

                        let detail = '';

                        // Check for holidays
                        if (includeHolidays) {
                            const holiday = ALL_HOLIDAYS.find(h => h.date === dateStr);
                            if (holiday) {
                                detail = `${holiday.name} (${holiday.source})`;
                            }
                        }

                        // Add weekend marking
                        if (includeWeekends && !detail) {
                            if (dayOfWeek === 0) {
                                detail = 'วันอาทิตย์';
                            } else if (dayOfWeek === 6) {
                                detail = 'วันเสาร์';
                            }
                        }

                        if (detail) {
                            daysToCreate.push({ monthId, date: dateStr, detail });
                        }
                    }
                }
            } else if (importType === 'daily' || importType === 'weekly') {
                // For date range based import
                if (!startDate || !endDate) {
                    alert('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด');
                    setIsLoading(false);
                    return;
                }

                const start = new Date(startDate);
                const end = new Date(endDate);

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    const dayOfWeek = d.getDay();

                    // Find the month this date belongs to
                    const [year, month] = dateStr.split('-');
                    const monthValue = `${year}-${month}`;
                    const targetMonth = yearMonths.find(m => m.month === monthValue);

                    if (!targetMonth) continue;

                    // Skip if already exists
                    if (dayExists(targetMonth.id, dateStr)) {
                        skipped++;
                        continue;
                    }

                    let detail = '';

                    // Check for holidays
                    if (includeHolidays) {
                        const holiday = ALL_HOLIDAYS.find(h => h.date === dateStr);
                        if (holiday) {
                            detail = `${holiday.name} (${holiday.source})`;
                        }
                    }

                    // Add weekend marking
                    if (includeWeekends && !detail) {
                        if (dayOfWeek === 0) {
                            detail = 'วันอาทิตย์';
                        } else if (dayOfWeek === 6) {
                            detail = 'วันเสาร์';
                        }
                    }

                    if (detail) {
                        daysToCreate.push({ monthId: targetMonth.id, date: dateStr, detail });
                    }
                }
            }

            // Create days via API
            for (const dayData of daysToCreate) {
                try {
                    const response = await fetch('/api/days', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            monthId: dayData.monthId,
                            date: dayData.date,
                            entries: [{ id: Date.now().toString(), detail: dayData.detail, responsible: '' }],
                        }),
                    });

                    if (response.ok) {
                        success++;
                    } else {
                        failed++;
                    }

                    // Small delay to prevent overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch {
                    failed++;
                }
            }

            setResult({ success, failed, skipped });
            await refreshData();
        } catch (error) {
            console.error('Bulk import error:', error);
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '16px',
            }}
        >
            <div
                className="modal-content-lg"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '20px',
                    maxWidth: '750px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                📥 นำเข้าวันแบบ Bulk
                            </h2>
                            <p className="text-white/80 mt-1 text-sm">
                                รองรับปีงบประมาณ 2568-2572 ({currentYearData?.name || ''})
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <span className="text-2xl">✕</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Import Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📌 รูปแบบการนำเข้า
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                                { value: 'daily', label: '📆 รายวัน', desc: 'เลือกช่วงวัน' },
                                { value: 'weekly', label: '📅 รายสัปดาห์', desc: 'เลือกช่วงสัปดาห์' },
                                { value: 'monthly', label: '📋 รายเดือน', desc: 'เลือกเดือน' },
                                { value: 'multi-month', label: '📊 หลายเดือน', desc: 'เลือกหลายเดือน' },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setImportType(type.value as ImportType)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${importType === type.value
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{type.label}</div>
                                    <div className="text-xs text-gray-500">{type.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range (for daily/weekly) */}
                    {(importType === 'daily' || importType === 'weekly') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📅 วันที่เริ่มต้น
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    min="2024-10-01"
                                    max="2029-09-30"
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📅 วันที่สิ้นสุด
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || "2024-10-01"}
                                    max="2029-09-30"
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div className="col-span-2 text-xs text-gray-500">
                                💡 รองรับวันที่ 1 ต.ค. 2567 ถึง 30 ก.ย. 2572 (ปีงบประมาณ 2568-2572)
                            </div>
                        </div>
                    )}

                    {/* Month Selection (for monthly/multi-month) */}
                    {(importType === 'monthly' || importType === 'multi-month') && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    🗓️ เลือกเดือน ({selectedMonths.length} เดือน)
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectAllMonths}
                                        className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                                    >
                                        เลือกทั้งหมด
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={clearAllMonths}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        ยกเลิกทั้งหมด
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {yearMonths.map((month) => (
                                    <button
                                        key={month.id}
                                        onClick={() => handleMonthToggle(month.id)}
                                        className={`p-2 rounded-lg border text-sm transition-all ${selectedMonths.includes(month.id)
                                            ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {selectedMonths.includes(month.id) ? '✓ ' : ''}{month.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                            {yearMonths.length === 0 && (
                                <p className="text-amber-600 text-sm mt-2">
                                    ⚠️ ไม่พบเดือนในปีงบประมาณนี้ กรุณาเพิ่มเดือนก่อน
                                </p>
                            )}
                        </div>
                    )}

                    {/* Options */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                        <h4 className="font-medium text-gray-700">⚙️ ตัวเลือกการนำเข้า</h4>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeWeekends}
                                onChange={(e) => setIncludeWeekends(e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded"
                            />
                            <span>💜❤️ รวมวันเสาร์-อาทิตย์</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeHolidays}
                                onChange={(e) => setIncludeHolidays(e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded"
                            />
                            <span>🏖️ รวมวันหยุดราชการ (อ้างอิง มติ ครม. 2568-2572)</span>
                        </label>
                    </div>

                    {/* Preview Button */}
                    <button
                        onClick={handlePreview}
                        disabled={importType.includes('month') && selectedMonths.length === 0}
                        className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-all disabled:opacity-50"
                    >
                        👁️ ดูตัวอย่างข้อมูลที่จะนำเข้า
                    </button>

                    {/* Preview Data */}
                    {previewData.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-xl max-h-48 overflow-y-auto">
                            <h4 className="font-medium text-blue-700 mb-2">
                                📋 ตัวอย่างข้อมูล ({previewData.length} รายการ)
                            </h4>
                            <div className="space-y-1 text-sm">
                                {previewData.slice(0, 15).map((item, idx) => (
                                    <div key={idx} className="flex gap-2 text-blue-600">
                                        <span className="font-mono min-w-[90px]">{item.date}</span>
                                        <span>→</span>
                                        <span className="flex-1">{item.detail}</span>
                                        {item.source && (
                                            <span className="text-xs text-blue-400">({item.source})</span>
                                        )}
                                    </div>
                                ))}
                                {previewData.length > 15 && (
                                    <p className="text-blue-500 italic">...และอีก {previewData.length - 15} รายการ</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Official Sources Reference */}
                    <div className="bg-amber-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-amber-700 flex items-center gap-2">
                                <span>📜</span>
                                แหล่งอ้างอิงวันหยุดราชการอย่างเป็นทางการ
                            </h4>
                            <button
                                onClick={() => setShowSources(!showSources)}
                                className="text-xs text-amber-600 hover:text-amber-800"
                            >
                                {showSources ? 'ซ่อน' : 'ดูเพิ่มเติม'}
                            </button>
                        </div>

                        {showSources ? (
                            <div className="space-y-3 mt-3">
                                {OFFICIAL_SOURCES.map((source, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200">
                                        <div className="font-medium text-amber-800">{source.name}</div>
                                        <div className="text-sm text-amber-600">{source.description}</div>
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                        >
                                            🔗 {source.url}
                                        </a>
                                    </div>
                                ))}
                                <div className="text-xs text-amber-600 mt-2 p-2 bg-amber-100 rounded">
                                    💡 <strong>หมายเหตุ:</strong> วันหยุดปี 2569-2572 เป็นการคาดการณ์จากปฏิทินจันทรคติและหลักเกณฑ์ ครม.
                                    ควรตรวจสอบกับประกาศอย่างเป็นทางการเมื่อมีการประกาศจริง
                                </div>
                            </div>
                        ) : (
                            <ul className="text-sm text-amber-600 space-y-1">
                                <li>• มติคณะรัฐมนตรี (ครม.) ประจำปี พ.ศ. 2568-2572</li>
                                <li>• สำนักเลขาธิการคณะรัฐมนตรี (สลค.)</li>
                                <li>• กรมบัญชีกลาง กระทรวงการคลัง</li>
                                <li>• ปฏิทินจันทรคติไทย (วันมาฆบูชา, วิสาขบูชา, อาสาฬหบูชา)</li>
                            </ul>
                        )}
                    </div>

                    {/* Result */}
                    {result && (
                        <div className={`p-4 rounded-xl ${result.failed > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                            <h4 className={`font-medium ${result.failed > 0 ? 'text-amber-700' : 'text-green-700'} mb-2`}>
                                📊 ผลการนำเข้า
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="text-green-600">✓ สำเร็จ: {result.success} รายการ</span>
                                {result.skipped > 0 && (
                                    <span className="text-gray-500">⏭️ ข้าม (มีอยู่แล้ว): {result.skipped} รายการ</span>
                                )}
                                {result.failed > 0 && (
                                    <span className="text-red-600">✕ ล้มเหลว: {result.failed} รายการ</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 sticky bottom-0">
                    <button
                        onClick={generateDays}
                        disabled={isLoading || (importType.includes('month') && selectedMonths.length === 0)}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isLoading ? '⏳ กำลังนำเข้า...' : '📥 เริ่มนำเข้า'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
