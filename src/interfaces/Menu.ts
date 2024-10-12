type Course = {
    name: string;
    price: string;
    diets: string;

 };

 type DailyMenu = {
    courses: Course[];
 };

 type Day= DailyMenu & {date: string};

 type WeeklyMenu = {
    days: Day[];

};
export { DailyMenu, WeeklyMenu, Course};
