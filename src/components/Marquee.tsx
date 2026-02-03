'use client';

import React from 'react';
import { useApp } from '@/lib/context';

interface MarqueeItem {
    date: string;
    text: string;
    type: 'activity' | 'holiday' | 'special';
}

export default function Marquee() {
    const { days, months, selectedYear } = useApp();

    const getMarqueeItems = (): MarqueeItem[] => {
        const items: MarqueeItem[] = [];
        const yearMonths = months.filter((m) => m.yearId === selectedYear);

        yearMonths.forEach((month) => {
            const monthDays = days.filter((d) => d.monthId === month.id);
            monthDays.forEach((day) => {
                if (day.entries && day.entries.length > 0) {
                    const detail = day.entries[0].detail;
                    const [year, monthNum, dayNum] = day.date.split('-');
                    const thaiYear = parseInt(year) + 543;
                    const monthNames = [
                        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
                    ];
                    const dateStr = `${parseInt(dayNum)} ${monthNames[parseInt(monthNum) - 1]} ${thaiYear}`;

                    // Determine type
                    let type: MarqueeItem['type'] = 'activity';
                    if (detail.includes('วันหยุด') || detail.includes('ปิดราชการ') || detail.includes('หยุดชดเชย')) {
                        type = 'holiday';
                    } else if (detail.includes('พิเศษ') || detail.includes('สำคัญ')) {
                        type = 'special';
                    }

                    // Skip weekend-only entries
                    if (!detail.includes('วันเสาร์') && !detail.includes('วันอาทิตย์')) {
                        items.push({
                            date: dateStr,
                            text: detail,
                            type,
                        });
                    }
                }
            });
        });

        return items.slice(0, 20); // Limit to 20 items
    };

    const marqueeItems = getMarqueeItems();

    if (marqueeItems.length === 0) {
        return null;
    }

    const getIcon = (type: MarqueeItem['type']) => {
        switch (type) {
            case 'holiday':
                return '🏖️';
            case 'special':
                return '⭐';
            default:
                return '📌';
        }
    };

    const getColor = (type: MarqueeItem['type']) => {
        switch (type) {
            case 'holiday':
                return 'text-rose-300';
            case 'special':
                return 'text-yellow-300';
            default:
                return 'text-cyan-300';
        }
    };

    return (
        <div className="marquee-container py-3">
            <div className="marquee-content">
                {/* Duplicate items for seamless scrolling */}
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                    <React.Fragment key={index}>
                        <div className="marquee-item">
                            <span className="text-xl">{getIcon(item.type)}</span>
                            <span className={`font-semibold ${getColor(item.type)}`}>
                                {item.date}
                            </span>
                            <span className="text-white">
                                {item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text}
                            </span>
                        </div>
                        <span className="marquee-divider">✦</span>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
