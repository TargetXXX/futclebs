import { Player, PlayerPosition } from "@/services/supabase";

export const calculateByPosition = (player: Player, stats: any) =>  {

    const { velocidade, finalizacao, passe, drible, defesa, fisico, esportividade } = stats;


    let overall = 0;

    if(player.is_goalkeeper) {
        overall = ((defesa * 20) + (esportividade * 20) + (passe * 20)) / 3;

        return Math.round(overall);
    }

    if(player.positions?.includes("Ataque")) {
        overall = ((velocidade * 20 * 2) + (finalizacao * 20 * 3) + (passe * 20 * 1) + (drible * 20 * 2) + (fisico * 20 * 2) + (esportividade * 20 * 0.5) + (defesa * 20 * 0.5)) / 11;
    } else if(player.positions?.includes("Meio")) {
        overall = ((velocidade * 20 * 1) + (passe * 20 * 3) + (drible * 20 * 2) + (defesa * 20 * 2) + (fisico * 20 * 2) + (esportividade * 20 * 0.5) + (finalizacao * 20 * 1)) / 11;
    } else if(player.positions?.includes("Defesa")) {
        overall = ((velocidade * 20 * 2.5) + (defesa * 20 * 3) + (passe * 20 * 2) + (fisico * 20 * 3) + (esportividade * 20 * 0.5) + (finalizacao * 20 * 0.5) + (drible * 20 * 0.5)) / 12;
    }

    return Math.round(overall);
};