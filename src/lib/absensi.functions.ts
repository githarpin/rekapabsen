// Fungsi server pembaca foto absensi lewat AI Gateway Lovable.
// Modul ini aman diimpor dari komponen; isi handler tidak ikut bundle klien.
import { createServerFn } from "@tanstack/react-start";
import { Output, streamText, type ModelMessage } from "ai";
import { z } from "zod";

import type { HasilBacaFoto } from "./absensi";

const SKEMA_HASIL = z.object({
  namaDosen: z.string().nullable(),
  namaKelas: z.string().nullable(),
  namaMataKuliah: z.string().nullable(),
  tanggal: z.string().nullable(),
  metode: z.enum(["Teori", "Praktik"]).nullable(),
  sks: z.number().nullable(),
});

type HasilBacaAi = z.infer<typeof SKEMA_HASIL>;

export type JawabanBacaFoto =
  | { ok: true; hasil: HasilBacaAi }
  | { ok: false; pesan: string };

const PROMPT =
  "Periksa foto lembar absensi atau bukti mengajar ini. Baca isinya lalu kembalikan: " +
  "nama dosen yang mengajar, nama kelas, nama mata kuliah, tanggal pertemuan " +
  "(format YYYY-MM-DD), metode mengajar (Teori atau Praktik), dan jumlah SKS pertemuan. " +
  "Gunakan null untuk data yang tidak terbaca dengan jelas. Jangan menebak.";

export const bacaFotoAbsensi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ foto: z.string().min(20) }).parse(input),
  )
  .handler(async ({ data }): Promise<JawabanBacaFoto> => {
    const { createAiProvider } = await import("./ai-gateway.server");
    const provider = createAiProvider();

    const messages: ModelMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image", image: data.foto },
        ],
      },
    ];

    const hasil = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      messages,
      maxRetries: 0,
      output: Output.object({ schema: SKEMA_HASIL }),
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    try {
      return { ok: true, hasil: await hasil.output };
    } catch (error) {
      console.error("Gagal membaca foto absensi:", error);
      const pesan =
        error instanceof Error && error.message
          ? error.message
          : "Gagal membaca foto. Coba lagi.";
      return { ok: false, pesan };
    }
  });
