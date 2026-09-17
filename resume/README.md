# Resume compilation

The one-page PDF is generated from `resume.md` using ReportLab.

## Compilation

From the repository root directory:

```bash
python3 -m pip install -r resume/requirements.txt
python3 resume/build_resume.py
```

## Output

The compiled PDF is saved to `out/resume.pdf`.
