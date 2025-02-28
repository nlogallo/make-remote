#!/usr/bin/env node

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const AdmZip = require("adm-zip");

const app = express();
const upload = multer({ dest: "uploads/" });

const WORKSPACE_DIR = path.join(__dirname, "workspace");
const OUTPUT_DIR = path.join(__dirname, "outputs");

// Ensure directories exist
fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

app.post(
    "/compile",
    upload.fields([{ name: "makefile", maxCount: 1 }, { name: "files", maxCount: 50 }, { name: "make_args", maxCount: 1 }]),
    (req, res) => {
        if (!req.files.makefile || !req.files.files) {
            return res.status(400).send("Error: Makefile and at least one source file are required.");
        }

        const jobId = Date.now().toString();
        const jobPath = path.join(WORKSPACE_DIR, jobId);
        fs.mkdirSync(jobPath, { recursive: true });

        // Move Makefile
        const makefilePath = path.join(jobPath, "Makefile");
        fs.renameSync(req.files.makefile[0].path, makefilePath);

        // Move all source files
        req.files.files.forEach((file) => {
            fs.renameSync(file.path, path.join(jobPath, file.originalname));
        });

        // Get optional Make arguments
        const makeArgs = req.body.make_args || "";

        console.log(`Running make in ${jobPath} with args: ${makeArgs}`);

        // Run make and capture output
        const makeProcess = exec(`make ${makeArgs}`, { cwd: jobPath });

        makeProcess.stdout.pipe(res, { end: false });
        makeProcess.stderr.pipe(res, { end: false });

        makeProcess.on("close", (code) => {
            if (code !== 0) {
                res.write(`\nMake failed with exit code ${code}\n`);
                return res.end();
            }

            // Create ZIP of all generated files
            const outputZipPath = path.join(OUTPUT_DIR, `output_${jobId}.zip`);
            const outputZip = new AdmZip();

            fs.readdirSync(jobPath).forEach((file) => {
                const filePath = path.join(jobPath, file);
                if (fs.lstatSync(filePath).isFile() && file !== "Makefile") {
                    outputZip.addLocalFile(filePath);
                }
            });

            outputZip.writeZip(outputZipPath);

            // Send download URL instead of file directly
            res.write(`\nCompilation successful. JobId: ${jobId}\n`);
            res.end();
        });
    }
);

// Route to download compiled ZIP
app.get("/download/:jobId", (req, res) => {
    const outputZipPath = path.join(OUTPUT_DIR, `output_${req.params.jobId}.zip`);

    if (!fs.existsSync(outputZipPath)) {
        return res.status(404).send("Error: File not found.");
    }

    res.download(outputZipPath, "compiled_output.zip", (err) => {
        if (err) {
            console.error("Error sending output:", err);
        }
        // Cleanup workspace after sending
        fs.unlinkSync(outputZipPath);
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));
