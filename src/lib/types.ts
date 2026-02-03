export interface Settings {
    schoolName: string;
    educationOffice: string;
    schoolLogo: string;
}

export interface User {
    id: string;
    username: string;
    password: string;
    fullname: string;
}

export interface Year {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
}

export interface Month {
    id: string;
    yearId: string;
    month: string; // yyyy-MM format
    name: string;
}

export interface DayEntry {
    id: string;
    detail: string;
    responsible: string;
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    mimeType: string;
    size: number;
}

export interface Day {
    id: string;
    monthId: string;
    date: string; // yyyy-MM-dd format
    entries: DayEntry[];
    attachments?: Attachment[];
}
