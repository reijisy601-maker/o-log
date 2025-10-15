import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { luggageSpaceImageUrl, toolBagImageUrl, userId, month } = await request.json()

    console.log(
      "[v0] Received image URLs - Luggage length:",
      luggageSpaceImageUrl?.length,
      "ToolBag length:",
      toolBagImageUrl?.length,
    )

    if (!luggageSpaceImageUrl || !toolBagImageUrl || !userId || !month) {
      return NextResponse.json({ message: "必須パラメータが不足しています" }, { status: 400 })
    }

    const validateAndFixBase64 = (dataUrl: string): string => {
      // data:image/...;base64, の形式を確認
      if (!dataUrl.startsWith("data:image/")) {
        throw new Error("Invalid image format")
      }

      // base64部分のみを抽出して再構築
      const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!matches) {
        throw new Error("Invalid base64 format")
      }

      const [, imageType, base64Data] = matches

      // base64文字列をクリーンアップ（改行や空白を削除）
      const cleanBase64 = base64Data.replace(/\s/g, "")

      return `data:image/${imageType};base64,${cleanBase64}`
    }

    const cleanLuggageUrl = validateAndFixBase64(luggageSpaceImageUrl)
    const cleanToolBagUrl = validateAndFixBase64(toolBagImageUrl)

    console.log(
      "[v0] Cleaned URLs - Luggage length:",
      cleanLuggageUrl.length,
      "ToolBag length:",
      cleanToolBagUrl.length,
    )

    const supabase = await getSupabaseServerClient()

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || user.id !== userId) {
        return NextResponse.json({ message: "認証エラー" }, { status: 401 })
      }
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY is not set")
      return NextResponse.json({ message: "サーバー設定エラー" }, { status: 500 })
    }

    // ラゲッジスペースの解析
    console.log("[v0] Analyzing luggage space image...")
    const luggageResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `この画像はラゲッジスペース（車のトランク）の整理状態です。プロの整理整頓コンサルタントの視点で、非常に厳しく「第一印象」を評価してください。

評価基準：
- 90点以上：完璧に近い整理状態。すべての物が最適な位置に配置され、無駄なスペースがなく、プロフェッショナルレベルの整理整頓。
- 80-89点：非常に良い状態。ほとんどの物が適切に配置されているが、わずかな改善の余地がある。
- 70-79点：良い状態。基本的な整理はできているが、さらなる最適化が可能。
- 60-69点：普通。整理されているが、明確な改善点が複数ある。
- 50-59点：やや散らかっている。整理が不十分で、多くの改善が必要。
- 50点未満：散らかっている。整理整頓が必要。

以下の観点から厳しく評価してください：
1. ぱっと見た時の第一印象（整然としているか）
2. 物の配置の合理性（取り出しやすさ、使用頻度に応じた配置）
3. スペースの有効活用（無駄なスペースがないか）
4. 清潔感（汚れ、ほこり、不要な物がないか）
5. 統一感（収納容器の統一、ラベリングなど）

0-98点でスコアを付け、具体的な改善点を含む評価コメント（日本語で100文字程度）を返してください。

重要：もしこの画像がラゲッジスペースではない場合、「適切な画像ではありません。ラゲッジスペース（車のトランク）の写真を再度アップロードしてください。」と返してください。`,
              },
              {
                type: "image_url",
                image_url: { url: cleanLuggageUrl },
              },
            ],
          },
        ],
        max_tokens: 400,
      }),
    })

    if (!luggageResponse.ok) {
      const error = await luggageResponse.json()
      console.error("[v0] OpenAI API error (luggage):", JSON.stringify(error, null, 2))
      return NextResponse.json({ message: "AI解析に失敗しました（ラゲッジスペース）" }, { status: 500 })
    }

    const luggageData = await luggageResponse.json()
    const luggageAnalysis = luggageData.choices[0]?.message?.content || ""
    console.log("[v0] Luggage analysis complete")

    // ツールバッグの解析
    console.log("[v0] Analyzing tool bag image...")
    const toolBagResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `この画像は工具や作業用品の収納容器の整理状態です。プロの整理整頓コンサルタントの視点で、非常に厳しく「第一印象」を評価してください。

収納容器の種類：
- 布製のツールバッグ
- プラスチック製の工具箱やツールトレイ
- 金属製のツールボックス
- 収納ケースやパーツケース
- その他、工具や作業用品を収納している容器

評価基準：
- 90点以上：完璧に近い整理状態。すべての工具が最適な位置に配置され、無駄なスペースがなく、プロフェッショナルレベルの整理整頓。
- 80-89点：非常に良い状態。ほとんどの工具が適切に配置されているが、わずかな改善の余地がある。
- 70-79点：良い状態。基本的な整理はできているが、さらなる最適化が可能。
- 60-69点：普通。整理されているが、明確な改善点が複数ある。
- 50-59点：やや散らかっている。整理が不十分で、多くの改善が必要。
- 50点未満：散らかっている。整理整頓が必要。

以下の観点から厳しく評価してください：
1. ぱっと見た時の第一印象（整然としているか）
2. 工具の配置の合理性（取り出しやすさ、種類別の分類）
3. スペースの有効活用（無駄なスペースがないか）
4. 清潔感（汚れ、ほこり、不要な物がないか）
5. 統一感（仕切りの使用、ラベリングなど）

0-98点でスコアを付け、具体的な改善点を含む評価コメント（日本語で100文字程度）を返してください。

重要：工具や作業用品が収納されている容器であれば、形状や種類に関わらず評価してください。ただし、この画像が工具や作業用品とは全く関係のない画像（例：風景、人物、食べ物、動物など）の場合のみ、「適切な画像ではありません。工具や作業用品の収納容器の写真を再度アップロードしてください。」と返してください。`,
              },
              {
                type: "image_url",
                image_url: { url: cleanToolBagUrl },
              },
            ],
          },
        ],
        max_tokens: 400,
      }),
    })

    if (!toolBagResponse.ok) {
      const error = await toolBagResponse.json()
      console.error("[v0] OpenAI API error (toolbag):", JSON.stringify(error, null, 2))
      return NextResponse.json({ message: "AI解析に失敗しました（ツールバッグ）" }, { status: 500 })
    }

    const toolBagData = await toolBagResponse.json()
    const toolBagAnalysis = toolBagData.choices[0]?.message?.content || ""
    console.log("[v0] Tool bag analysis complete")

    // スコア抽出
    const luggageScoreMatch = luggageAnalysis.match(/(\d+)点/)
    const luggageScore = luggageScoreMatch ? Math.min(98, Math.max(0, Number.parseInt(luggageScoreMatch[1]))) : 50

    const toolBagScoreMatch = toolBagAnalysis.match(/(\d+)点/)
    const toolBagScore = toolBagScoreMatch ? Math.min(98, Math.max(0, Number.parseInt(toolBagScoreMatch[1]))) : 50

    // 平均スコア
    const averageScore = Math.round((luggageScore + toolBagScore) / 2)

    console.log("[v0] Scores - Luggage:", luggageScore, "ToolBag:", toolBagScore, "Average:", averageScore)

    if (supabase) {
      const { error: upsertError } = await supabase.from("submissions").upsert(
        {
          user_id: userId,
          luggage_space_image_url: cleanLuggageUrl,
          tool_bag_image_url: cleanToolBagUrl,
          luggage_space_score: luggageScore,
          tool_bag_score: toolBagScore,
          score: averageScore,
          luggage_space_comment: luggageAnalysis,
          tool_bag_comment: toolBagAnalysis,
          month,
          image_url: cleanLuggageUrl,
          analysis_result: `ラゲッジスペース: ${luggageAnalysis}\n\nツールバッグ: ${toolBagAnalysis}`,
        },
        {
          onConflict: "user_id,month",
        },
      )

      if (upsertError) {
        console.error("[v0] Database upsert error:", upsertError)
        return NextResponse.json({ message: "データベースエラー" }, { status: 500 })
      }
    }

    return NextResponse.json({
      averageScore,
      luggageScore,
      toolBagScore,
      luggageAnalysis,
      toolBagAnalysis,
    })
  } catch (error) {
    console.error("[v0] Analyze image error:", error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "サーバーエラー",
      },
      { status: 500 },
    )
  }
}
