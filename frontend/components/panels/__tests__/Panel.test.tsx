/**
 * GYA-37 — Panel component tests
 */

import React from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Panel } from "../Panel";
import { PanelHeader } from "../PanelHeader";
import { CollapsiblePanel } from "../CollapsiblePanel";

// Ensure DOM is cleaned up between tests to avoid element collision
afterEach(cleanup);

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

describe("Panel", () => {
  it("renders the heading", () => {
    const { getByRole } = render(<Panel heading="Tonight">body</Panel>);
    expect(getByRole("heading", { name: "Tonight" })).toBeInTheDocument();
  });

  it("renders eyebrow text when provided", () => {
    const { getByText } = render(<Panel heading="Tonight" eyebrow="Sky brief">body</Panel>);
    expect(getByText("Sky brief")).toBeInTheDocument();
  });

  it("does not render eyebrow element when omitted", () => {
    const { queryByText } = render(<Panel heading="Tonight">body</Panel>);
    expect(queryByText(/eyebrow/i)).not.toBeInTheDocument();
  });

  it("renders children in the body", () => {
    const { getByText } = render(<Panel heading="Panel"><span>hello world</span></Panel>);
    expect(getByText("hello world")).toBeInTheDocument();
  });

  it("renders the action slot", () => {
    const { getByRole } = render(
      <Panel heading="Panel" actions={<button>Share</button>}>body</Panel>
    );
    expect(getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("uses the provided headingLevel", () => {
    const { getByRole } = render(<Panel heading="Events" headingLevel={3}>body</Panel>);
    expect(getByRole("heading", { level: 3, name: "Events" })).toBeInTheDocument();
  });

  it("applies aria-label from heading to the section", () => {
    const { container } = render(<Panel heading="Conditions">body</Panel>);
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-label", "Conditions");
  });
});

// ---------------------------------------------------------------------------
// PanelHeader
// ---------------------------------------------------------------------------

describe("PanelHeader", () => {
  it("renders heading and eyebrow", () => {
    const { getByText } = render(<PanelHeader heading="Satellite passes" eyebrow="Next 24h" />);
    expect(getByText("Satellite passes")).toBeInTheDocument();
    expect(getByText("Next 24h")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    const { getByRole } = render(
      <PanelHeader heading="Events" actions={<button>Refresh</button>} />
    );
    expect(getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CollapsiblePanel
// ---------------------------------------------------------------------------

describe("CollapsiblePanel", () => {
  it("renders heading and eyebrow", () => {
    const { getByRole, getByText } = render(
      <CollapsiblePanel heading="Observation brief" eyebrow="Tonight">
        content
      </CollapsiblePanel>
    );
    expect(getByRole("heading", { name: "Observation brief" })).toBeInTheDocument();
    expect(getByText("Tonight")).toBeInTheDocument();
  });

  it("is open by default (aria-expanded=true)", () => {
    const { getByRole } = render(<CollapsiblePanel heading="Sky data">body</CollapsiblePanel>);
    expect(
      getByRole("button", { name: /collapse sky data/i })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("respects defaultOpen=false", () => {
    const { getByRole } = render(
      <CollapsiblePanel heading="Sky data" defaultOpen={false}>body</CollapsiblePanel>
    );
    expect(
      getByRole("button", { name: /expand sky data/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses when toggle button is clicked", () => {
    const { getByRole } = render(<CollapsiblePanel heading="Sky data">body</CollapsiblePanel>);
    const btn = getByRole("button", { name: /collapse sky data/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("expands again after a second click", () => {
    const { getByRole } = render(<CollapsiblePanel heading="Sky data">body</CollapsiblePanel>);
    const btn = getByRole("button", { name: /collapse sky data/i });
    fireEvent.click(btn);
    // After collapsing it becomes "expand"
    const expandBtn = getByRole("button", { name: /expand sky data/i });
    fireEvent.click(expandBtn);
    expect(getByRole("button", { name: /collapse sky data/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("aria-hidden syncs with collapsed state on the body", () => {
    const { getByRole, container } = render(<CollapsiblePanel heading="Sky data">body</CollapsiblePanel>);
    const btn = getByRole("button", { name: /collapse sky data/i });
    const bodyId = btn.getAttribute("aria-controls")!;
    const body = container.querySelector(`#${CSS.escape(bodyId)}`)!;

    // Initially open
    expect(body).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(btn);
    expect(body).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the extra actions slot alongside toggle", () => {
    const { getByRole } = render(
      <CollapsiblePanel heading="Sky data" actions={<button>Refresh</button>}>
        body
      </CollapsiblePanel>
    );
    expect(getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(getByRole("button", { name: /collapse sky data/i })).toBeInTheDocument();
  });
});
