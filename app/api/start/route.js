import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function GET() {
    exec("next dev", (error, stdout, stderr) => {
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ output: stdout || stderr }, { status: 200 });
    });

    return NextResponse.json({ message: "Dev server starting..." });
}
