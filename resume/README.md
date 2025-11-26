# Resume Compilation

This directory contains the LaTeX source file for the resume.

## Prerequisites

- Docker (for compilation without local LaTeX installation)

## Compilation

The resume is compiled using Docker with a LaTeX image. This allows compilation without installing LaTeX locally.

### Using Docker

From the repository root directory:

```bash
docker run --rm -v "$(pwd):/workspace" -w /workspace/resume blang/latex:ubuntu pdflatex -output-directory=../out resume.tex
```

This command:
- Uses the `blang/latex:ubuntu` Docker image
- Mounts the current directory as `/workspace` in the container
- Sets the working directory to `/workspace/resume`
- Compiles `resume.tex` using `pdflatex`
- Outputs the PDF to `../out/resume.pdf`

### Alternative: Local LaTeX Installation

If you have LaTeX installed locally (e.g., via MacTeX on macOS or TeX Live on Linux), you can compile directly:

```bash
cd resume
pdflatex -output-directory=../out resume.tex
```

## Output

The compiled PDF is saved to `out/resume.pdf`.

## Notes

- The Docker image may show a platform mismatch warning (linux/amd64 vs linux/arm64) on Apple Silicon Macs, but it still works correctly.
- The compilation may produce some LaTeX warnings about underfull hboxes, which are normal for this document format.

