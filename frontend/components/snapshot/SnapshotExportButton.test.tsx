import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SnapshotExportButton } from "./SnapshotExportButton";

const baseProps = {
  location: { lat: 25.61, lon: 85.14, label: "Patna, India" },
  timeUtc: "2026-08-12T20:30:00.000Z",
  layers: ["planets", "moon"] as const,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SnapshotExportButton", () => {
  it("copies serialized metadata to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<SnapshotExportButton {...baseProps} selectedObject={{ id: "saturn", name: "Saturn" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy snapshot metadata" }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied).toContain("Project Zenith");
    expect(copied).toContain("saturn");
  });

  it("handles missing selected object", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<SnapshotExportButton {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy snapshot metadata" }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(writeText.mock.calls[0]![0]).not.toContain("selectedObject");
  });

  it("renders manual fallback when clipboard fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("blocked"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<SnapshotExportButton {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy snapshot metadata" }));

    expect(await screen.findByLabelText("Snapshot metadata")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copy manually");
  });
});
