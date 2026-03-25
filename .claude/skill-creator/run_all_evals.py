#!/usr/bin/env python3
"""Create trigger evals for all installed skills and run them."""

import json
import subprocess
import sys
from pathlib import Path

PLUGINS_DIR = Path.home() / ".claude/plugins/marketplaces/claude-plugins-official/plugins"
SKILL_CREATOR_DIR = Path(__file__).parent  # .claude/skill-creator/ in the project
SKILL_CREATOR_SCRIPTS = SKILL_CREATOR_DIR / "scripts"

# Trigger evals keyed by skill name
EVALS: dict[str, list[dict]] = {
    "claude-automation-recommender": [
        {"query": "What Claude Code automations should I set up for my project?", "should_trigger": True},
        {"query": "Recommend hooks and skills for my codebase", "should_trigger": True},
        {"query": "How should I configure Claude Code for this repo?", "should_trigger": True},
        {"query": "What Claude Code features should I enable for my project?", "should_trigger": True},
        {"query": "Analyze my project and suggest automation improvements", "should_trigger": True},
        {"query": "What MCP servers would help with my workflow?", "should_trigger": True},
        {"query": "Set up Claude Code automations for this Next.js project", "should_trigger": True},
        {"query": "What subagents and plugins make sense here?", "should_trigger": True},
        {"query": "Fix the bug in my authentication middleware", "should_trigger": False},
        {"query": "Add a dark mode toggle to my React app", "should_trigger": False},
        {"query": "Write a SQL query to get the top 10 users", "should_trigger": False},
        {"query": "Explain what this Python function does", "should_trigger": False},
        {"query": "Create a new REST endpoint for user profile updates", "should_trigger": False},
        {"query": "Help me set up CI/CD with GitHub Actions", "should_trigger": False},
        {"query": "Refactor this component to use hooks", "should_trigger": False},
        {"query": "Review my pull request for code quality", "should_trigger": False},
    ],
    "claude-md-improver": [
        {"query": "Check my CLAUDE.md files and improve them", "should_trigger": True},
        {"query": "Audit CLAUDE.md across the project", "should_trigger": True},
        {"query": "Fix the CLAUDE.md in this repo", "should_trigger": True},
        {"query": "Update our project memory files", "should_trigger": True},
        {"query": "My CLAUDE.md needs improvement, can you help?", "should_trigger": True},
        {"query": "Scan and improve all CLAUDE.md files", "should_trigger": True},
        {"query": "Run CLAUDE.md maintenance on this project", "should_trigger": True},
        {"query": "Review and optimize the project memory in CLAUDE.md", "should_trigger": True},
        {"query": "Add TypeScript support to this project", "should_trigger": False},
        {"query": "Fix the bug in my login form", "should_trigger": False},
        {"query": "Write unit tests for this module", "should_trigger": False},
        {"query": "Update the README with installation instructions", "should_trigger": False},
        {"query": "Refactor the database connection logic", "should_trigger": False},
        {"query": "Add error handling to the API route", "should_trigger": False},
        {"query": "Deploy this app to Vercel", "should_trigger": False},
        {"query": "Help me understand how this codebase is structured", "should_trigger": False},
    ],
    "frontend-design": [
        {"query": "Build a landing page for my SaaS product", "should_trigger": True},
        {"query": "Create a beautiful dashboard component", "should_trigger": True},
        {"query": "Design a pricing table with modern styling", "should_trigger": True},
        {"query": "Make a responsive navbar with dropdown menus", "should_trigger": True},
        {"query": "Build a hero section with animations", "should_trigger": True},
        {"query": "Create a signup form with great UX", "should_trigger": True},
        {"query": "Design a card grid for displaying products", "should_trigger": True},
        {"query": "Build a modal dialog with backdrop blur", "should_trigger": True},
        {"query": "Fix the authentication bug in my Express app", "should_trigger": False},
        {"query": "Write a Python script to parse CSV files", "should_trigger": False},
        {"query": "Set up a PostgreSQL database schema", "should_trigger": False},
        {"query": "Explain how React hooks work", "should_trigger": False},
        {"query": "Debug the memory leak in my Node.js app", "should_trigger": False},
        {"query": "Create a bash script for file backups", "should_trigger": False},
        {"query": "Help me write unit tests with Jest", "should_trigger": False},
        {"query": "Set up websocket connections in my backend", "should_trigger": False},
    ],
    "writing-hookify-rules": [
        {"query": "Create a hookify rule for my project", "should_trigger": True},
        {"query": "Write a hook rule to validate my commits", "should_trigger": True},
        {"query": "Configure hookify for this repo", "should_trigger": True},
        {"query": "Add a new hookify rule that runs tests before save", "should_trigger": True},
        {"query": "How do I write a hookify rule?", "should_trigger": True},
        {"query": "Set up hookify automation rules", "should_trigger": True},
        {"query": "Add TypeScript to this project", "should_trigger": False},
        {"query": "Fix the bug in the payment processing code", "should_trigger": False},
        {"query": "Create a React component for the user profile", "should_trigger": False},
        {"query": "Help me write git commit hooks manually", "should_trigger": False},
        {"query": "Set up ESLint for this codebase", "should_trigger": False},
        {"query": "Create a GitHub Actions workflow", "should_trigger": False},
    ],
    "build-mcp-server": [
        {"query": "Build an MCP server for my GitHub integration", "should_trigger": True},
        {"query": "Create an MCP server that wraps the Stripe API", "should_trigger": True},
        {"query": "Make an MCP integration for our internal database", "should_trigger": True},
        {"query": "I want to expose my tools to Claude via MCP", "should_trigger": True},
        {"query": "Create an MCP server for Slack messaging", "should_trigger": True},
        {"query": "Wrap our REST API as an MCP server", "should_trigger": True},
        {"query": "Build an MCP app with tool definitions", "should_trigger": True},
        {"query": "Help me expose tools to Claude using Model Context Protocol", "should_trigger": True},
        {"query": "Fix this React component's state management bug", "should_trigger": False},
        {"query": "Write a SQL migration for adding user roles", "should_trigger": False},
        {"query": "Help me deploy my Next.js app to AWS", "should_trigger": False},
        {"query": "Add authentication to my Express server", "should_trigger": False},
        {"query": "Review my Python data processing script", "should_trigger": False},
        {"query": "Create unit tests for my service layer", "should_trigger": False},
        {"query": "Fix the TypeScript type errors in this file", "should_trigger": False},
        {"query": "Set up a Redis cache for my application", "should_trigger": False},
    ],
    "build-mcp-app": [
        {"query": "Add interactive UI widgets to my MCP server", "should_trigger": True},
        {"query": "Build an MCP app with a form picker", "should_trigger": True},
        {"query": "Create a dashboard widget inside Claude chat", "should_trigger": True},
        {"query": "Add a confirmation dialog to my MCP tool", "should_trigger": True},
        {"query": "Build interactive MCP UI resources", "should_trigger": True},
        {"query": "I want to render components inline using the apps SDK", "should_trigger": True},
        {"query": "Create an MCP app with a data table widget", "should_trigger": True},
        {"query": "Add a date picker widget to my MCP integration", "should_trigger": True},
        {"query": "Fix the login bug in my web app", "should_trigger": False},
        {"query": "Build a standard REST API endpoint", "should_trigger": False},
        {"query": "Create a React dashboard component", "should_trigger": False},
        {"query": "Set up Stripe payments for my SaaS", "should_trigger": False},
        {"query": "Write unit tests for my auth service", "should_trigger": False},
        {"query": "Help me optimize my database queries", "should_trigger": False},
        {"query": "Create a CLI tool using Node.js", "should_trigger": False},
        {"query": "Build an MCP server (no UI needed)", "should_trigger": False},
    ],
    "build-mcpb": [
        {"query": "Package my MCP server as an MCPB file", "should_trigger": True},
        {"query": "Bundle my MCP server for distribution", "should_trigger": True},
        {"query": "Make an MCPB that works without Node installed", "should_trigger": True},
        {"query": "Ship a local MCP server as a .mcpb file", "should_trigger": True},
        {"query": "Bundle a Python runtime with my MCP server", "should_trigger": True},
        {"query": "Create a distributable local MCP server", "should_trigger": True},
        {"query": "Package my filesystem MCP tool as MCPB", "should_trigger": True},
        {"query": "Make my MCP server installable without setup", "should_trigger": True},
        {"query": "Build a remote HTTP MCP server", "should_trigger": False},
        {"query": "Create a web-based MCP integration", "should_trigger": False},
        {"query": "Write a Python script for data processing", "should_trigger": False},
        {"query": "Build a React component library", "should_trigger": False},
        {"query": "Set up Docker for my application", "should_trigger": False},
        {"query": "Create an npm package", "should_trigger": False},
        {"query": "Fix the authentication in my REST API", "should_trigger": False},
        {"query": "Deploy to Cloudflare Workers", "should_trigger": False},
    ],
    "playground": [
        {"query": "Create an interactive playground for CSS animations", "should_trigger": True},
        {"query": "Make a color picker explorer tool", "should_trigger": True},
        {"query": "Build an interactive prompt builder", "should_trigger": True},
        {"query": "Create an HTML playground for typography", "should_trigger": True},
        {"query": "Make an explorer tool for gradient configurations", "should_trigger": True},
        {"query": "Build a visual configurator with live preview", "should_trigger": True},
        {"query": "Create a playground for testing regex patterns", "should_trigger": True},
        {"query": "Make an interactive tool to explore chart styles", "should_trigger": True},
        {"query": "Fix the payment processing bug", "should_trigger": False},
        {"query": "Write a Python scraper for product data", "should_trigger": False},
        {"query": "Add Stripe integration to my app", "should_trigger": False},
        {"query": "Create a Next.js API route", "should_trigger": False},
        {"query": "Help me debug this TypeScript error", "should_trigger": False},
        {"query": "Optimize my database queries for performance", "should_trigger": False},
        {"query": "Set up authentication with JWT tokens", "should_trigger": False},
        {"query": "Review my React component architecture", "should_trigger": False},
    ],
    "command-development": [
        {"query": "Create a slash command for code review", "should_trigger": True},
        {"query": "Add a /deploy command to my project", "should_trigger": True},
        {"query": "Write a custom command with file references", "should_trigger": True},
        {"query": "Define command arguments with frontmatter", "should_trigger": True},
        {"query": "Create an interactive slash command", "should_trigger": True},
        {"query": "How do I use AskUserQuestion in a command?", "should_trigger": True},
        {"query": "Make a /summarize command for my workflow", "should_trigger": True},
        {"query": "Set up dynamic bash execution in a command", "should_trigger": True},
        {"query": "Fix the authentication bug in my app", "should_trigger": False},
        {"query": "Create a React component for user profiles", "should_trigger": False},
        {"query": "Write unit tests for my service", "should_trigger": False},
        {"query": "Set up a CI/CD pipeline", "should_trigger": False},
        {"query": "Build a REST API with Express", "should_trigger": False},
        {"query": "Help me refactor this class to use composition", "should_trigger": False},
        {"query": "Add TypeScript types to this JavaScript file", "should_trigger": False},
        {"query": "Explain how async/await works", "should_trigger": False},
    ],
    "skill-development": [
        {"query": "Create a new skill for my Claude Code plugin", "should_trigger": True},
        {"query": "Add a skill to my existing plugin", "should_trigger": True},
        {"query": "Write a new skill with progressive disclosure", "should_trigger": True},
        {"query": "Improve my skill description for better triggering", "should_trigger": True},
        {"query": "How should I organize content in my skill?", "should_trigger": True},
        {"query": "Create a skill with references and assets", "should_trigger": True},
        {"query": "Build a code-review skill for my plugin", "should_trigger": True},
        {"query": "Make a skill that follows best practices", "should_trigger": True},
        {"query": "Fix the bug in my React component", "should_trigger": False},
        {"query": "Set up a PostgreSQL database", "should_trigger": False},
        {"query": "Write a bash script for deployment", "should_trigger": False},
        {"query": "Create a REST API with FastAPI", "should_trigger": False},
        {"query": "Add dark mode support to my app", "should_trigger": False},
        {"query": "Help me optimize database queries", "should_trigger": False},
        {"query": "Write integration tests for my service", "should_trigger": False},
        {"query": "Explain the difference between props and state", "should_trigger": False},
    ],
    "plugin-settings": [
        {"query": "How do I store plugin configuration?", "should_trigger": True},
        {"query": "Make my plugin settings user-configurable", "should_trigger": True},
        {"query": "Use .local.md files to store plugin state", "should_trigger": True},
        {"query": "Set up per-project plugin settings", "should_trigger": True},
        {"query": "Read YAML frontmatter in my plugin", "should_trigger": True},
        {"query": "How do I persist plugin state across sessions?", "should_trigger": True},
        {"query": "Configure my plugin with YAML settings", "should_trigger": True},
        {"query": "Store user preferences in my Claude plugin", "should_trigger": True},
        {"query": "Add user authentication to my web app", "should_trigger": False},
        {"query": "Fix the layout bug in my dashboard", "should_trigger": False},
        {"query": "Write a Python ETL pipeline", "should_trigger": False},
        {"query": "Set up environment variables for my project", "should_trigger": False},
        {"query": "Create API rate limiting middleware", "should_trigger": False},
        {"query": "Deploy my app to AWS Lambda", "should_trigger": False},
        {"query": "Add Stripe webhooks to my backend", "should_trigger": False},
        {"query": "Refactor this module for better testability", "should_trigger": False},
    ],
    "plugin-structure": [
        {"query": "Create a new Claude Code plugin from scratch", "should_trigger": True},
        {"query": "Scaffold a plugin with commands and skills", "should_trigger": True},
        {"query": "Help me understand the plugin directory structure", "should_trigger": True},
        {"query": "Set up plugin.json for my plugin", "should_trigger": True},
        {"query": "Organize my plugin components correctly", "should_trigger": True},
        {"query": "Configure auto-discovery for my plugin", "should_trigger": True},
        {"query": "Use ${CLAUDE_PLUGIN_ROOT} in my plugin config", "should_trigger": True},
        {"query": "Add hooks and agents to my existing plugin", "should_trigger": True},
        {"query": "Help me build a React app", "should_trigger": False},
        {"query": "Write a database migration script", "should_trigger": False},
        {"query": "Fix the authentication flow in my app", "should_trigger": False},
        {"query": "Create unit tests for my service layer", "should_trigger": False},
        {"query": "Set up Docker compose for local development", "should_trigger": False},
        {"query": "Add error boundaries to my React app", "should_trigger": False},
        {"query": "Optimize the SQL queries in my app", "should_trigger": False},
        {"query": "Build a CLI tool with Commander.js", "should_trigger": False},
    ],
    "hook-development": [
        {"query": "Create a PreToolUse hook to validate commands", "should_trigger": True},
        {"query": "Add a PostToolUse hook to log tool usage", "should_trigger": True},
        {"query": "Set up a Stop hook for session cleanup", "should_trigger": True},
        {"query": "Build a hook that blocks dangerous shell commands", "should_trigger": True},
        {"query": "Create an event-driven automation with hooks", "should_trigger": True},
        {"query": "Write a UserPromptSubmit hook for input validation", "should_trigger": True},
        {"query": "Set up hook events for PreCompact and SessionStart", "should_trigger": True},
        {"query": "Add a prompt-based hook to my plugin", "should_trigger": True},
        {"query": "Write a React component for user settings", "should_trigger": False},
        {"query": "Fix the payment processing error", "should_trigger": False},
        {"query": "Create a REST API with authentication", "should_trigger": False},
        {"query": "Write tests for my TypeScript service", "should_trigger": False},
        {"query": "Set up git commit hooks with husky", "should_trigger": False},
        {"query": "Add ESLint pre-commit hooks", "should_trigger": False},
        {"query": "Create a GitHub Actions workflow", "should_trigger": False},
        {"query": "Build a CI pipeline for my project", "should_trigger": False},
    ],
    "mcp-integration": [
        {"query": "Add an MCP server to my plugin", "should_trigger": True},
        {"query": "Integrate MCP with my Claude Code plugin", "should_trigger": True},
        {"query": "Configure .mcp.json for my plugin", "should_trigger": True},
        {"query": "Connect an external service via MCP to my plugin", "should_trigger": True},
        {"query": "Set up MCP server integration in my plugin", "should_trigger": True},
        {"query": "Use Model Context Protocol in my plugin config", "should_trigger": True},
        {"query": "Add an SSE MCP server to my plugin", "should_trigger": True},
        {"query": "Integrate a stdio MCP server with ${CLAUDE_PLUGIN_ROOT}", "should_trigger": True},
        {"query": "Build a React dashboard component", "should_trigger": False},
        {"query": "Fix the bug in my Express API", "should_trigger": False},
        {"query": "Write a Python data processing script", "should_trigger": False},
        {"query": "Add Stripe payments to my SaaS", "should_trigger": False},
        {"query": "Deploy my app to Kubernetes", "should_trigger": False},
        {"query": "Optimize my MongoDB queries", "should_trigger": False},
        {"query": "Create a Next.js app from scratch", "should_trigger": False},
        {"query": "Set up a standalone MCP server (not in a plugin)", "should_trigger": False},
    ],
    "agent-development": [
        {"query": "Create a subagent for my plugin", "should_trigger": True},
        {"query": "Add an agent to my Claude Code plugin", "should_trigger": True},
        {"query": "Write an autonomous agent with system prompts", "should_trigger": True},
        {"query": "Set up agent triggering conditions", "should_trigger": True},
        {"query": "Create an agent with custom tools and colors", "should_trigger": True},
        {"query": "Build an agent with frontmatter configuration", "should_trigger": True},
        {"query": "Add a specialized agent to handle code reviews", "should_trigger": True},
        {"query": "Create an agent that handles database migrations", "should_trigger": True},
        {"query": "Fix the login bug in my web app", "should_trigger": False},
        {"query": "Add TypeScript support to this project", "should_trigger": False},
        {"query": "Create a REST API with Node.js", "should_trigger": False},
        {"query": "Write unit tests for my components", "should_trigger": False},
        {"query": "Set up a Redis cache", "should_trigger": False},
        {"query": "Deploy to AWS with Terraform", "should_trigger": False},
        {"query": "Fix the CSS layout issue in my dashboard", "should_trigger": False},
        {"query": "Help me use Claude API in my app (not a plugin agent)", "should_trigger": False},
    ],
    "skill-creator": [
        {"query": "Create a new skill for my plugin", "should_trigger": True},
        {"query": "Help me write a skill from scratch", "should_trigger": True},
        {"query": "Run evals on my skill description", "should_trigger": True},
        {"query": "Optimize my skill's triggering accuracy", "should_trigger": True},
        {"query": "Benchmark my skill performance", "should_trigger": True},
        {"query": "Improve my existing skill", "should_trigger": True},
        {"query": "Test how well my skill triggers", "should_trigger": True},
        {"query": "Create and iterate on a new skill with evals", "should_trigger": True},
        {"query": "Fix the authentication bug in my app", "should_trigger": False},
        {"query": "Build a React component for user profiles", "should_trigger": False},
        {"query": "Set up a CI/CD pipeline with GitHub Actions", "should_trigger": False},
        {"query": "Write a SQL query for user analytics", "should_trigger": False},
        {"query": "Help me understand how async/await works", "should_trigger": False},
        {"query": "Create a landing page for my startup", "should_trigger": False},
        {"query": "Add dark mode to my Next.js app", "should_trigger": False},
        {"query": "Debug the memory leak in my Node service", "should_trigger": False},
    ],
}


def get_skill_paths() -> list[tuple[str, Path]]:
    """Return (skill_name, skill_path) for all installed skills with SKILL.md."""
    results = []
    for skill_path in sorted(PLUGINS_DIR.rglob("SKILL.md")):
        skill_dir = skill_path.parent
        # Parse name from SKILL.md frontmatter
        content = skill_path.read_text()
        name = None
        for line in content.splitlines():
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip()
                break
        if name:
            results.append((name, skill_dir))
    return results


def create_eval_file(skill_name: str, skill_dir: Path) -> Path | None:
    """Create trigger_eval.json if we have evals defined. Returns path or None."""
    if skill_name not in EVALS:
        return None
    evals_dir = skill_dir / "evals"
    evals_dir.mkdir(exist_ok=True)
    eval_file = evals_dir / "trigger_eval.json"
    if not eval_file.exists():
        eval_file.write_text(json.dumps(EVALS[skill_name], indent=2))
        print(f"  Created evals for: {skill_name}")
    return eval_file


def run_eval(skill_name: str, skill_dir: Path, eval_file: Path) -> dict | None:
    """Run the eval script for a skill. Returns result dict or None on failure."""
    cmd = [
        sys.executable, "-m", "scripts.run_eval",
        "--eval-set", str(eval_file),
        "--skill-path", str(skill_dir),
        "--runs-per-query", "1",
        "--num-workers", "8",
        "--timeout", "30",
        "--model", "claude-haiku-4-5-20251001",
        "--verbose",
    ]
    import os
    env = {**os.environ}

    print(f"\n  Running eval for: {skill_name} ({len(EVALS.get(skill_name, []))} queries)")
    try:
        result = subprocess.run(
            cmd,
            cwd=str(SKILL_CREATOR_DIR),
            capture_output=True,
            text=True,
            timeout=300,
            env=env,
        )
        if result.returncode != 0:
            print(f"  ERROR: {result.stderr[-500:]}")
            return None
        data = json.loads(result.stdout)
        # Print progress from stderr
        for line in result.stderr.splitlines():
            print(f"    {line}")
        return data
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT for {skill_name}")
        return None
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return None


def print_summary(all_results: list[dict]) -> None:
    """Print a summary table of all eval results."""
    print("\n" + "=" * 70)
    print("EVAL RESULTS SUMMARY")
    print("=" * 70)
    print(f"{'Skill':<35} {'Pass':<6} {'Total':<7} {'Score':<8} {'Status'}")
    print("-" * 70)

    for r in sorted(all_results, key=lambda x: -x["summary"]["passed"] / max(x["summary"]["total"], 1)):
        s = r["summary"]
        pct = s["passed"] / s["total"] * 100 if s["total"] > 0 else 0
        status = "✓ GOOD" if pct >= 80 else ("⚠ OK" if pct >= 60 else "✗ POOR")
        print(f"{r['skill_name']:<35} {s['passed']:<6} {s['total']:<7} {pct:>5.0f}%  {status}")

    # Failures detail
    print("\n" + "=" * 70)
    print("FAILURES DETAIL")
    print("=" * 70)
    for r in all_results:
        failures = [x for x in r["results"] if not x["pass"]]
        if failures:
            print(f"\n{r['skill_name']}:")
            for f in failures:
                direction = "↑ should trigger" if f["should_trigger"] else "↓ should NOT trigger"
                print(f"  [{direction}] rate={f['triggers']}/{f['runs']}: {f['query'][:65]}")


ALREADY_RAN: set[str] = set()  # Run all skills fresh


def main():
    print("=" * 70)
    print("SKILL TRIGGER EVAL RUNNER")
    print("=" * 70)

    skill_paths = get_skill_paths()
    print(f"\nFound {len(skill_paths)} installed skills")

    # Create missing eval files
    print("\nCreating eval files...")
    skills_to_eval: list[tuple[str, Path, Path]] = []
    for skill_name, skill_dir in skill_paths:
        if skill_name in ALREADY_RAN:
            print(f"  Skipping (already ran): {skill_name}")
            continue
        # Check for existing eval
        existing = skill_dir / "evals" / "trigger_eval.json"
        if existing.exists():
            skills_to_eval.append((skill_name, skill_dir, existing))
            print(f"  Using existing evals for: {skill_name}")
        else:
            eval_file = create_eval_file(skill_name, skill_dir)
            if eval_file:
                skills_to_eval.append((skill_name, skill_dir, eval_file))
            else:
                print(f"  Skipping (no evals defined): {skill_name}")

    print(f"\nRunning evals on {len(skills_to_eval)} skills...")

    # Seed with previously completed results
    prev_file = Path(__file__).parent / "eval_results.json"
    all_results = json.loads(prev_file.read_text()) if prev_file.exists() else []

    for skill_name, skill_dir, eval_file in skills_to_eval:
        result = run_eval(skill_name, skill_dir, eval_file)
        if result:
            all_results.append(result)

    if all_results:
        print_summary(all_results)

        # Save results
        output_file = Path(__file__).parent / "eval_results.json"
        output_file.write_text(json.dumps(all_results, indent=2))
        print(f"\nFull results saved to: {output_file}")
    else:
        print("\nNo results collected.")


if __name__ == "__main__":
    main()
