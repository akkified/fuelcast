# FuelCast: Problem, Audience & Research

## 1. Problem statement

> High-school athletes train hard, often every day after school, but almost none get expert guidance on **when** to eat and drink, **how** to train in the weight room around their games, or **what** to cook with the food they have. They show up under-fueled, lift at the wrong times, recover poorly, and the tools available to them (calorie counters and adult workout apps) are designed for weight loss or grown-ups, not teen athletes.

### Evidence

- **Scale:** The National Federation of State High School Associations (NFHS) reported more than **8 million** high-school sports participants in the 2023–24 school year, a record high.¹
- **Timing matters as much as food choice.** The major sports-nutrition position statement from the American College of Sports Medicine (ACSM), the Academy of Nutrition and Dietetics, and Dietitians of Canada says athletes should time their carbohydrate and protein intake around training: carbs in the 1–4 hours before exercise, carbs during longer sessions, and carbs plus protein afterward.²
- **Many young athletes start training dehydrated.** Studies of youth athletes have found that many arrive at practice already under-hydrated.³ Losing more than about 2% of body mass to sweat is associated with lower endurance performance.⁴,⁵
- **Under-fueling is a real health risk.** The 2023 International Olympic Committee consensus statement describes *Relative Energy Deficiency in Sport (REDs)*: not eating enough for the training load harms bone health, hormones, growth, and performance. Adolescents are specifically at risk.⁶
- **Expert help is out of reach.** Sports dietitians are standard in college and pro sports but rare at the high-school level, so most teens rely on guesswork, social media, or nothing.
- **Energy drinks are marketed to teens.** The American Academy of Pediatrics states that energy drinks are not appropriate for children and adolescents.⁷
- **Strength training helps teens, when it's done right.** The NSCA and AAP both support resistance training for adolescents. Their guidance: qualified supervision, technique first, 1–3 sets of 6–15 reps, 2–3 non-consecutive days a week, and progression in small steps.¹⁰,¹¹ Teens without a coach usually don't get that structure, and they rarely plan lifting around their game schedule.

## 2. Target audience

**Primary: high-school athletes, ages 14–18**, especially those with after-school practice, weekday games, early-morning sessions, and time in the weight room.

| Persona | Situation | What FuelCast gives them |
|---|---|---|
| **Maya, 16, varsity soccer** | Practice at 3:45 on weekdays, matches Wed/Fri, conditioning at 6:30 AM on Tuesdays, a Saturday lift. Often skips lunch and grabs vending-machine chips. | A timeline that tells her lunch *is* her pre-practice meal, a top-off from what's in her bag, a Smart Coach that keeps her legs fresh before matches, and recipes from her family's fridge. |
| **Jordan, 15, JV basketball** | New to the weight room, no idea what to eat, embarrassed to ask. | Beginner starter workouts with coaching cues, suggested weights that progress safely, an AI coach to ask anything, and no calories. |
| **A cross-country runner** | Long runs, sweats heavily in Georgia heat. | A sweat test that turns two weigh-ins into a personal "drink ~X oz per hour" number. |

**Secondary:** parents who pack food and cook dinner, and coaches or athletic trainers who want their team fueled.

## 3. Why existing apps fall short

| Existing approach | Gap FuelCast fills |
|---|---|
| Calorie counters (log everything, weight goals) | Tedious, focused on weight, and potentially harmful for teens. FuelCast has **no calories and no weight goals**. |
| Generic "healthy eating" advice | Doesn't account for *when* you train. FuelCast builds from **your actual schedule**. |
| Meal-plan apps | Assume you shop and cook. FuelCast works **from the food you already have**. |
| Water-reminder apps | One number for everyone. FuelCast adjusts for **training days and your measured sweat rate**. |
| Generic workout apps | Built for adults and ignore sports schedules. FuelCast's Smart Coach knows your **games and practices**, tracks **muscle readiness**, and follows **youth training guidelines**. |
| Recipe apps | Don't know what you're training for. FuelCast tags every recipe by the **fuel window it fits** and matches it to **your kitchen**. |
| General AI chatbots | Don't know your schedule or kitchen, and can give teens adult diet advice. FuelCast's AI Coach gets **your context** and **teen-safe rules**, and returns workouts built from a vetted exercise library. |

## 4. The science behind each feature

| FuelCast rule | Source |
|---|---|
| Carb-focused meal 3–4 h before; carbs 1–4 g/kg in the 1–4 h before exercise | ACSM/AND/DC 2016² |
| Small, low-fat, low-fiber carb snack close to exercise to avoid GI upset | ACSM/AND/DC 2016² |
| 30–60 g carbs per hour for sessions longer than about an hour | ACSM/AND/DC 2016² |
| Recovery: carbs + ~0.25–0.3 g/kg protein (about 15–25 g) soon after | ACSM/AND/DC 2016² |
| Pre-exercise fluid ~5–7 mL/kg at least 4 h before | ACSM 2007⁴ |
| Sweat rate = (pre − post weight + fluid − urine) ÷ time; limit losses to under 2% body mass | ACSM 2007⁴; NATA 2017⁵ |
| Replace 1.25–1.5 L of fluid per kg lost after exercise | ACSM/AND/DC 2016²; ACSM 2007⁴ |
| Energy drinks never recommended | AAP 2011⁷ |
| Daily fluid baseline (2 L of beverages, below the Adequate Intake for total water for ages 14–18) | Institute of Medicine 2005⁸ |
| Food macro values | USDA FoodData Central⁹ |
| 1–3 sets of 6–15 reps, technique first, 2–3 non-consecutive strength days a week | NSCA 2009¹⁰; AAP 2020¹¹ |
| Small, steady load increases (FuelCast: ~5% when every rep was completed at a manageable effort) | NSCA 2009¹⁰ |
| Spotter for barbell pressing; stop and see an athletic trainer for pain | NSCA 2009¹⁰; AAP 2020¹¹ |
| No hard leg work or conditioning the day before a game (a taper) | FuelCast coaching rule, a conservative, common in-season practice |

FuelCast uses the **conservative, general end** of each range because it serves teens without individual supervision. It's education, and the app says so on the welcome screen and in Settings.

## 5. Ethical design decisions

1. **No calorie counts or weight goals anywhere.** The app talks about fuel and energy, not body size.
2. **Body weight is optional**, stored only on the device, and used only to scale gram and fluid targets and for the sweat test.
3. **No accounts, no data collection, no ads.**
4. **No food is "bad."** Foods are rated only for *timing* ("Not now," not "unhealthy"). Chips before practice are "Not now"; they aren't shamed.
5. **A clear medical disclaimer** that points athletes to their athletic trainer, doctor, or a registered dietitian.
6. **Sample data is always labeled.** The demo athlete shows a "Sample athlete · demo data" badge on every screen that uses it.
7. **Responsible AI.** The AI Coach is optional and off by default. It gets a minimal context (no name or weight), follows teen-safe rules in its system prompt, can only build workouts from our vetted exercise library, and tells athletes to see an athletic trainer or doctor about pain, injuries or eating concerns. Every AI message is labeled "AI Coach · Claude", and every on-device answer is labeled "Smart Coach · on-device".

## 6. References

1. National Federation of State High School Associations. *2023–24 High School Athletics Participation Survey.* NFHS; 2024. https://www.nfhs.org/sports-resource-content/high-school-participation-survey-archive/
2. Thomas DT, Erdman KA, Burke LM. American College of Sports Medicine Joint Position Statement: Nutrition and athletic performance. *Med Sci Sports Exerc.* 2016;48(3):543-568. https://pubmed.ncbi.nlm.nih.gov/26891166/
3. Arnaoutis G, Kavouras SA, Angelopoulou A, et al. Fluid balance during training in elite young athletes of different sports. *J Strength Cond Res.* 2015;29(12):3447-3452.
4. Sawka MN, Burke LM, Eichner ER, Maughan RJ, Montain SJ, Stachenfeld NS. American College of Sports Medicine position stand: Exercise and fluid replacement. *Med Sci Sports Exerc.* 2007;39(2):377-390. https://pubmed.ncbi.nlm.nih.gov/17277604/
5. McDermott BP, Anderson SA, Armstrong LE, et al. National Athletic Trainers' Association position statement: Fluid replacement for the physically active. *J Athl Train.* 2017;52(9):877-895. https://pubmed.ncbi.nlm.nih.gov/28985128/
6. Mountjoy M, Ackerman KE, Bailey DM, et al. 2023 International Olympic Committee's (IOC) consensus statement on Relative Energy Deficiency in Sport (REDs). *Br J Sports Med.* 2023;57(17):1073-1097.
7. Committee on Nutrition and the Council on Sports Medicine and Fitness. Sports drinks and energy drinks for children and adolescents: are they appropriate? *Pediatrics.* 2011;127(6):1182-1189. https://pubmed.ncbi.nlm.nih.gov/21624882/
8. Institute of Medicine. *Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate.* Washington, DC: The National Academies Press; 2005.
9. U.S. Department of Agriculture, Agricultural Research Service. *FoodData Central.* https://fdc.nal.usda.gov/
10. Faigenbaum AD, Kraemer WJ, Blimkie CJR, et al. Youth resistance training: updated position statement paper from the National Strength and Conditioning Association. *J Strength Cond Res.* 2009;23(5 Suppl):S60-S79. https://pubmed.ncbi.nlm.nih.gov/19620931/
11. Stricker PR, Faigenbaum AD, McCambridge TM; Council on Sports Medicine and Fitness. Resistance training for children and adolescents. *Pediatrics.* 2020;145(6):e20201011. https://pubmed.ncbi.nlm.nih.gov/32457216/

> **Before you present:** open each link once and confirm the numbers you quote in the video (especially the NFHS participation figure, which NFHS updates every year).
