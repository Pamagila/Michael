import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getMatchAnalysis(homeTeam: string, awayTeam: string, league: string) {
  try {
    const prompt = `Ukiwa kama mchambuzi bingwa wa soka duniani, fanya uchambuzi wa kina na wa kitaalamu kwa mechi ijayo kati ya ${homeTeam} dhidi ya ${awayTeam} katika liga ya ${league}.
    
    Yatakiwa uchambuzi wako uwe na:
    1. **Historia na Fomu**: Historia ya timu hizi zikikutana (Head-to-Head) na fomu ya sasa (Mechi 5 zilizopita).
    2. **Vikosi**: Vikosi vinavyotarajiwa (Predicted Start Lineups) kwa timu zote mbili kwa namna ya orodha.
    3. **Utabiri wa Win Probability**: Uwezekano wa Ushindi kwa asilimia (Home Win %, Draw %, Away Win %).
    4. **Masoko Mengine (Other Predicted Markets)**:
       - Utabiri wa Magoli (Over/Under 2.5)
       - Timu zote kufungana (BTTS: Ndiyo/Hapana)
       - Idadi ya Kona (Nyingi/Chache)
       - Kadi (Nyingi/Chache)
    5. **Uchambuzi wa Ndani**: Sababu za kitalaamu za utabiri wako.
    
    Andika kwa lugha ya Kiswahili fasaha na yenye kuvutia. Hakikisha mpangilio ni mzuri kwa mtindo wa Bold na Bullet Points ili ivutie kwenye App. Usitumie lugha ya kubet.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating analysis:", error);
    return "Samahani, imetokea hitilafu wakati wa kuandaa uchambuzi huu. Tafadhali jaribu tena baadae.";
  }
}

export async function getGlobalPrediction(query: string) {
  try {
    const prompt = `Wewe ni mtabiri mbobezi wa soka duniani mwenye uwezo wa kutambua timu yoyote ile, iwe ni ligi kuu, daraja la kwanza, la pili, au hata timu za mitaani na vyuo popote duniani (Tanzania, Ulaya, Asia, Amerika, Afrika). 
    
    Mtumiaji anakuuliza: "${query}". 
    Toa utabiri wako wa kina kwa mechi hii au timu hii. 
    
    Katika jibu lako, hakikisha unajumuisha:
    1. **Uhakika wa Utabiri**: Uwezekano wa Ushindi kwa asilimia (%).
    2. **Kikosi**: Vikosi vinavyotarajiwa kuanza kwa ufasaha.
    3. **Masoko ya Ziada**: Utabiri wa Magoli, BTTS, Kona na Kadi.
    4. **Uchambuzi wa Kitaalamu**: Sababu za kina kwanini umechagua utabiri huo (Fomu, Majeruhi, Mazingira).
    
    Andika kwa Kiswahili fasaha chenye mvuto na ujasiri. Mpangilio uwe safi na wa kuvutia kwenye screen ya simu.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating global prediction:", error);
    return "Imeshindwa kupata utabiri kwa wakati huu. Hakikisha umeandika jina la timu au mechi vizuri.";
  }
}
