export type CourseApi = {
  id: number;
  name: string;
  day: string;
  duration: string;
  teacherName: string;
  departmentName: string;
};

export type CourseCell = CourseApi | null;

export type ScheduleRow = {
  duration: string;
  hetfo: CourseApi[];
  kedd: CourseApi[];
  szerda: CourseApi[];
  csutortok: CourseApi[];
  pentek: CourseApi[];
};

export type DayKey = Exclude<keyof ScheduleRow, "duration">;