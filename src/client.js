#!/usr/bin/env node

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const unzipper = require("unzipper");

let serverUrl = "http://localhost:3000";
let outputFolder = "compiled_output";
let projectDir = null;
let makeArgs = "";

// Parse CLI arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === "-s" && args[i + 1]) serverUrl = args[++i];
    else if (args[i] === "-o" && args[i + 1]) outputFolder = args[++i];
    else if (args[i] === "-m" && args[i + 1]) makeArgs = args[++i];
    else projectDir = args[i];
}

if (!projectDir) {
    console.error("Usage: make-remote [-s <server_url>] [-o <output_folder>] [-m \"make_args\"] <project_directory>");
    process.exit(1);
}

if (!fs.existsSync(projectDir) || !fs.lstatSync(projectDir).isDirectory()) {
    console.error(`Error: '${projectDir}' is not a valid directory.`);
    process.exit(1);
}

// Find Makefile
const makefilePath = path.join(projectDir, "Makefile");
if (!fs.existsSync(makefilePath)) {
    console.error("Error: No Makefile found in the project directory.");
    process.exit(1);
}

// Collect all source files (excluding hidden files and .git/)
const sourceFiles = fs.readdirSync(projectDir)
    .filter(file => !file.startsWith(".") && file !== "Makefile" && fs.lstatSync(path.join(projectDir, file)).isFile());

if (sourceFiles.length === 0) {
    console.error("Error: No source files found in", projectDir);
    process.exit(1);
}

async function compile() {
    const form = new FormData();
    form.append("makefile", fs.createReadStream(makefilePath));
    form.append("make_args", makeArgs);

    sourceFiles.forEach((file) => {
        form.append("files", fs.createReadStream(path.join(projectDir, file)), file);
    });

    try {
        console.log(`Uploading files from '${projectDir}' to ${serverUrl} with make arguments: '${makeArgs}'...`);
        const response = await axios.post(`${serverUrl}/compile`, form, {
            headers: form.getHeaders(),
            responseType: "stream",
        });

        return new Promise((resolve, reject) => {
            let jobId = null;

            response.data.on("data", (chunk) => {
                const message = chunk.toString();
                process.stdout.write(message);

                // Extract JobId from "Compilation successful. JobId: <jobId>"
                const jobIdMatch = message.match(/JobId:\s*(\w+)/);
                if (jobIdMatch) jobId = jobIdMatch[1];
            });

            response.data.on("end", () => {
                if (jobId) {
                    console.log(`\nCompilation finished. Job ID: ${jobId}`);
                    resolve(jobId); // Return jobId
                } else {
                    reject(new Error("Compilation finished but no Job ID received."));
                }
            });

            response.data.on("error", (error) => reject(error));
        });
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        throw error;
    }
}

async function download(jobId) {
    try {
        console.log(`Downloading compiled output for Job ID: ${jobId} from ${serverUrl}...`);

        const response = await axios.get(`${serverUrl}/download/${jobId}`, {
            responseType: "arraybuffer", // Expecting a binary ZIP file
        });

        // Ensure output folder exists
        fs.mkdirSync(outputFolder, { recursive: true });

        // Save the ZIP file locally
        const zipFile = path.join(outputFolder, `compiled_output_${jobId}.zip`);
        fs.writeFileSync(zipFile, response.data);
        console.log(`Download complete. File saved as '${zipFile}'`);

        // Extract ZIP contents into output folder
        await fs.createReadStream(zipFile)
            .pipe(unzipper.Extract({ path: outputFolder }))
            .promise();

        console.log(`Extraction complete. Files extracted to '${outputFolder}'`);

        // Optionally delete ZIP after extraction
        fs.unlinkSync(zipFile);
        console.log("ZIP file deleted after extraction.");

    } catch (error) {
        console.error("Download error:", error.response ? error.response.data.toString() : error.message);
    }
}

compile().then(download);
