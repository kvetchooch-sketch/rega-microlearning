// These entries were checked against the linked sources on 2026-09-25.
// Drafts in the legacy Swift seed database are intentionally NOT imported here.
export const CATEGORIES = [
  ['ai','בינה מלאכותית','tech','spark'],['technology','טכנולוגיה','tech','chip'],
  ['science','מדע','science','atom'],['space','חלל','science','orbit'],
  ['history','היסטוריה','world','book'],['geography','גאוגרפיה','world','globe'],
  ['government','פוליטיקה וממשל','world','building'],['economics','כלכלה','money','chart'],
  ['finance','כסף אישי','money','chart'],['business','עסקים','money','building'],
  ['companies','חברות מוכרות','money','building'],['entrepreneurship','יזמות','money','spark'],
  ['psychology','פסיכולוגיה','people','brain'],['behavior','התנהגות אנושית','people','brain'],
  ['philosophy','פילוסופיה','ideas','book'],['people','אנשים ששינו דברים','people','person'],
  ['leaders','מנהיגים עסקיים','money','person'],['inventions','המצאות חשובות','tech','chip'],
  ['body','גוף האדם ורפואה','science','heart'],['nature','טבע ובעלי חיים','science','leaf'],
  ['math','מתמטיקה','ideas','chart'],['statistics','סטטיסטיקה והסתברות','ideas','chart'],
  ['decisions','קבלת החלטות','skills','spark'],['critical','חשיבה ביקורתית','skills','brain'],
  ['communication','תקשורת','skills','message'],['productivity','פרודוקטיביות','skills','clock'],
  ['learning','למידה','skills','book'],['career','קריירה','life','person'],
  ['life','כישורי חיים','life','leaf'],['habits','הרגלים טובים','life','check'],
  ['mistakes','טעויות נפוצות','life','check'],['advice','עצות מעשיות','life','spark'],
  ['everyday','דברים מהיום־יום','life','sun']
].map(([id,name,group,icon])=>({id,name,group,icon}));

const sources={
 venus:['NASA · Venus Facts','https://science.nasa.gov/venus/facts/'],
 water:['USGS · Water Density','https://www.usgs.gov/water-science-school/science/water-density'],
 whale:['NOAA Fisheries · Blue Whale','https://www.fisheries.noaa.gov/species/blue-whale'],
 ocean:['NOAA · Pacific Ocean','https://oceanservice.noaa.gov/facts/biggestocean.html'],
 qr:['DENSO WAVE · Error correction','https://www.qrcode.com/en/about/error_correction.html'],
 stats:['NIST · Measures of Location','https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm'],
 web:['CERN · The birth of the Web','https://home.cern/science/computing/the-birth-of-the-web/'],
 johnson:['NASA · Katherine Johnson','https://science.nasa.gov/people/katherine-johnson/'],
 curie:['Nobel Prize · Marie Curie','https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/'],
 access:['W3C WAI · Complex Images','https://www.w3.org/WAI/tutorials/images/complex/'],
 sba:['SBA · Plan your business','https://www.sba.gov/counseling/plan-your-business/'],
 ai:['NIST · Generative AI Profile','https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf'],
 constitution:['National Archives · U.S. Constitution','https://www.archives.gov/founding-docs/constitution-transcript'],
 corals:['NOAA · What are corals?','https://oceanservice.noaa.gov/education/tutorial_corals/coral01_intro.html'],
 plain:['Digital.gov · Plain language','https://digital.gov/guides/plain-language']
};
// A "why" section is editorial explanation, not a second independently proven claim.
const rows=[
 ['venus-rotation','space','סיבוב אחד של נוגה סביב עצמו נמשך יותר משנה על נוגה.','סיבוב מלא אורך כ־243 ימי ארץ; הקפה סביב השמש אורכת כ־225.','כאן מדובר בסיבוב ביחס לכוכבים, לא בזמן שבין שתי זריחות. שני סוגי ה״יום״ האלה שונים.','זה עוזר להפריד בין אורך הסיבוב של כוכב לכת לבין אורך השנה שלו.','venus','surprise'],
 ['venus-heat','space','נוגה חם יותר מכוכב חמה, אף שהוא רחוק יותר מהשמש.','האטמוספרה הצפופה שלו לוכדת חום באפקט חממה עז.','NASA מתארת את נוגה ככוכב הלכת החם במערכת השמש, עם טמפרטורת פני שטח של כ־467 מעלות צלזיוס.','המרחק מהשמש אינו הגורם היחיד שקובע את הטמפרטורה.','venus','surprise'],
 ['sunlight','space','האור שאנחנו רואים מהשמש יצא ממנה לפני כשמונה דקות.','גם לאור, המהיר מאוד, דרוש זמן כדי לעבור את המרחק אלינו.','NASA מציינת זמן מעבר של כשמונה דקות מהשמש לכדור הארץ, לעומת כשש דקות אל נוגה.','כשמסתכלים רחוק בחלל, רואים גם אחורה בזמן.','venus','surprise'],
 ['ice','science','קרח צף כי הוא פחות צפוף ממים נוזליים.','בקפיאה, מולקולות המים מסתדרות במבנה שמשאיר ביניהן יותר מקום.','המבנה הגבישי הפתוח מגדיל את הנפח ביחס לאותה מסה של מים נוזליים. זו התנהגות חריגה לעומת חומרים רבים.','אותו הסבר מחבר בין קוביית הקרח בכוס לבין קרחונים צפים.','water','surprise'],
 ['water-four','science','מים מתוקים צפופים במיוחד דווקא בסביבות 4 מעלות, לא בנקודת הקיפאון.','כשהם מתקררים עוד לקראת קפיאה, צפיפותם פוחתת.','USGS מסביר שמים צפופים יותר שוקעים מתחת למים צפופים פחות. יחד עם ציפת הקרח, זה משפיע על הקפיאה באגמים.','התכונה הזאת עוזרת להבין מדוע אגם קופא מלמעלה.','water','surprise'],
 ['whale','nature','לווייתן כחול ניזון כמעט רק מיצורים זעירים שנקראים קריל.','בעל החיים העצום מסנן כמויות גדולות של מי ים כדי להשיג אותם.','במקום שיניים שמשמשות ללעיסה, ללווייתן יש לוחות מזיפות המסננים מזון מתוך המים.','גודל של בעל חיים לא בהכרח דומה לגודל המזון שלו.','whale','surprise'],
 ['whale-size','nature','לפי NOAA, הלווייתן הכחול הוא בעל החיים הגדול ביותר שחי אי פעם בכדור הארץ.','הפרטים הגדולים יכולים להגיע לאורך של יותר מ־30 מטר.','NOAA מתאר אורכים של עד 110 רגל. המספר מתאר את הקצה העליון, לא כל לווייתן כחול.','כדאי להבחין בין גודל מרבי לבין גודל טיפוסי כשקוראים נתונים על בעלי חיים.','whale','surprise'],
 ['coral','nature','אלמוג הוא בעל חיים. גם כשהוא נראה כמו אבן או צמח.','אלמוגים בנויי שונית מורכבים מפוליפים זעירים.','NOAA מתאר פוליפ כיצור בעל פה המוקף זרועות. רבים חיים במושבות ובונים שלד קשיח.','המראה החיצוני לבדו עלול להטעות כשמנסים לסווג יצור חי.','corals','surprise'],
 ['pacific','geography','האוקיינוס השקט הוא הגדול והעמוק מבין אגני האוקיינוסים.','הוא מכסה שטח של יותר מ־155 מיליון קילומטרים רבועים.','NOAA מציין ששטחו גדול משטחן של כל היבשות יחד. המספרים תלויים בגבולות שבהם משתמשים במדידה.','מפת עולם שטוחה לא תמיד ממחישה עד כמה חלק גדול מהכוכב הוא אוקיינוס.','ocean','surprise'],
 ['qr','technology','קוד QR יכול להישאר קריא גם כשחלק ממנו נפגם.','הקוד מכיל מידע נוסף שמאפשר לתקן שגיאות.','DENSO WAVE מתאר ארבע רמות תיקון. היכולת לשחזר תלויה ברמה ובאופי הנזק, ולכן אין הבטחה שכל קוד פגום ייסרק.','תוספת מידע יכולה להעלות אמינות, גם אם לכאורה היא נראית מיותרת.','qr','surprise'],
 ['web-birth','history','הרשת העולמית הומצאה ב־CERN בשנת 1989.','טים ברנרס־לי פיתח דרך לקשר מידע בין מחשבים עבור קהילת המחקר.','CERN מתאר את הולדת ה־World Wide Web. ה־Web הוא מערכת של דפים וקישורים שפועלת על תשתית האינטרנט.','המצאה ששינתה את חיי היום־יום התחילה בצורך של חוקרים לשתף מידע.','web','surprise'],
 ['web-open','technology','ב־1993 CERN העמיד את תוכנת ה־Web לרשות הציבור.','ב־30 באפריל אותה שנה הוכנסה התוכנה לנחלת הכלל.','ההחלטה אפשרה שימוש חופשי בטכנולוגיה. CERN מציין אותה כשלב מרכזי בהתפשטות הרשת.','הדרך שבה מפיצים המצאה יכולה להיות חשובה כמו ההמצאה עצמה.','web','surprise'],
 ['johnson','people','לפני הטיסה שלו סביב כדור הארץ, ג׳ון גלן ביקש שקתרין ג׳ונסון תבדוק את חישובי המחשב.','היא בדקה את המספרים לקראת משימת Friendship 7 ב־1962.','NASA מתארת כיצד גלן ביקש מג׳ונסון לבדוק בעצמה את חישובי המסלול, גם אחרי שהארגון כבר השתמש במחשבים אלקטרוניים.','בדיקה עצמאית של תוצאה יכולה להיות חיונית גם כשכלי החישוב מתקדם.','johnson','surprise'],
 ['curie','people','מארי קירי זכתה בפרסי נובל בשני תחומי מדע שונים.','פיזיקה ב־1903 וכימיה ב־1911.','את פרס הפיזיקה חלקה עם פייר קירי ואנרי בקרל. פרס הכימיה הוענק לה על עבודתה בחקר הרדיום והפולוניום.','גבולות בין תחומים לא תמיד מתאימים לגבולות של תגלית.','curie','surprise'],
 ['median','statistics','מספר חריג אחד יכול להזיז את הממוצע הרבה יותר מאשר את החציון.','הממוצע מושפע מגודל כל מספר; החציון נשען על מיקומו בסדר.','למשל, בקבוצה 2, 3, 4, 5, 100 הממוצע הוא 22.8 והחציון הוא 4. זו המחשה חשבונית להבדל שמתאר NIST.','כשנתון מתואר כ״ממוצע״, כדאי לברר אם כמה ערכים חריגים מושכים אותו.','stats','useful'],
 ['mode','math','השכיח הוא הערך שמופיע הכי הרבה — ויכולים להיות כמה ערכים כאלה.','לא לכל אוסף נתונים יש שכיח יחיד.','בקבוצה 1, 1, 2, 2, 3 גם 1 וגם 2 מופיעים פעמיים. NIST מציין במפורש שהשכיח אינו בהכרח יחיד.','שלוש דרכים לתאר ״טיפוסי״ — ממוצע, חציון ושכיח — עשויות לתת תשובות שונות.','stats','useful'],
 ['ai-confidence','ai','תשובה בטוחה של AI יכולה להיות שגויה. הביטחון בניסוח אינו אימות.','NIST מונה יצירת מידע שגוי שנראה אמין בין סיכוני AI גנרטיבי.','המסמך מתאר confabulation: תוכן שגוי או כוזב שמוצג בביטחון. גם הפניה שנראית כמו מקור יכולה לדרוש בדיקה.','לפני שמסתמכים על טענה, פותחים את המקור ובודקים שהוא באמת תומך בה.','ai','useful'],
 ['ai-citation','critical','עצם הופעתה של אסמכתה בתשובת AI לא מוכיחה שהאסמכתה אמיתית.','מודלים עלולים ליצור גם הפניות שנראות משכנעות אך אינן קיימות.','פרופיל הסיכונים של NIST כולל אזכורים ולוגיקה מומצאים כחלק מסיכון יצירת המידע הכוזב.','בדיקה טובה מתחילה בקיום המקור, וממשיכה בהתאמה בין המקור לבין הטענה.','ai','useful'],
 ['chart-access','communication','לתרשים טוב כדאי לצרף גם הסבר מילולי של המסקנה.','תמונה לבדה אינה מעבירה את המידע לכל הקוראים.','W3C ממליץ על חלופה טקסטואלית לתמונות מורכבות, הכוללת את המידע המהותי, היחסים והמגמות.','כך המידע נגיש גם למי שמשתמש בקורא מסך וגם למי שלא מכיר את הגרף.','access','useful'],
 ['plain-language','communication','כתיבה ברורה מתחילה בשאלה מי עומד לקרוא אותה.','אותו מידע דורש הסבר שונה לקהל מקצועי ולקהל לא מוכר.','המדריך הממשלתי Digital.gov מציג כתיבה בשפה ברורה כתוכן שמותאם לקהל המסוים שלו, כדי שיהיה אפשר להבין ולהשתמש בו.','לפני קיצור משפטים, כדאי לברר מה הקורא כבר יודע ומה הוא צריך לעשות.','plain','useful'],
 ['market-research','entrepreneurship','לפני בניית מוצר, כדאי לבדוק גם מה אנשים כבר קונים במקום פתרון כזה.','מחקר שוק כולל ביקוש, תמחור, רוויה ותחרות.','SBA ממליץ לשלב מחקר שוק וניתוח תחרותי בתכנון העסק, כדי להבין את הלקוחות ואת החלופות הקיימות.','הרעיון יכול להישמע שימושי ועדיין להתחרות בהרגל או במוצר שכבר מספקים את הצורך.','sba','useful'],
 ['business-plan','business','תוכנית עסקית לא חייבת להיות מסמך ארוך.','SBA מתאר גם פורמט רזה שמרכז את המרכיבים העיקריים.','תוכנית רזה מסכמת את הקשרים, המשאבים, הערך ללקוח ומבנה הכסף. חלק מהמלווים והמשקיעים עדיין עשויים לבקש פירוט נוסף.','כדי להתחיל לחשוב מסודר, אפשר קודם לנסח את ההנחות המרכזיות.','sba','useful'],
 ['constitution','government','החוקה המקורית של ארצות הברית מחולקת לשבעה סעיפים ראשיים.','התיקונים לחוקה מופיעים בנפרד מהטקסט המקורי.','בתמליל הארכיון הלאומי מופיעים Articles I–VII, ובהם מסגרת הרשויות, היחסים בין המדינות, שינוי החוקה ואשרורה.','כשמדברים על חוקה, חשוב להבחין בין הטקסט המקורי לבין שינויים שנוספו בהמשך.','constitution','surprise'],
 ['qr-tradeoff','technology','תיקון שגיאות חזק יותר בקוד QR בא במחיר של יותר מידע בקוד.','אמינות וקיבולת הן חלק מאותה בחירת תכנון.','DENSO WAVE מסביר שהעלאת רמת התיקון מוסיפה נתוני תיקון. בוחרים את הרמה לפי התנאים והסיכון ללכלוך או לנזק.','בהנדסה, שיפור תכונה אחת כרוך לעיתים בשימוש במשאבים נוספים.','qr','useful']
];
export const FACTS=rows.map(([id,category,shortFact,summary,explanation,whyItMatters,source,kind])=>({
 id,title:shortFact,shortFact,summary,explanation,whyItMatters,category,subcategory:'general',
 sources:[{name:sources[source][0],url:sources[source][1],publicationDate:null}],
 dateVerified:'2026-09-25',verificationStatus:'sourceChecked',
 verificationNote:'הניסוח נבדק מול המקור המקושר. המשמעות המעשית היא הסבר עריכתי.',
 tags:[kind],difficulty:'easy',freshness:'evergreen',nextReviewAt:null,
 createdAt:'2026-09-25',updatedAt:'2026-09-25',kind
}));
export const AVAILABLE_CATEGORIES=CATEGORIES.filter(c=>FACTS.some(f=>f.category===c.id));
