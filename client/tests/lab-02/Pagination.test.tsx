import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../../src/components/Pagination.js";

describe("Pagination Component", () => {
  it("renders page info and navigation controls correctly", () => {
    render(
      <Pagination
        page={1}
        totalPages={10}
        totalItems={100}
        onPageChange={vi.fn()}
      />
    );

    // Verify info text
    expect(screen.getByText(/Page 1 of 10 · 100 tickets/i)).toBeInTheDocument();

    // Verify buttons exist
    expect(screen.getByLabelText("First page")).toBeDisabled();
    expect(screen.getByLabelText("Previous")).toBeDisabled();
    expect(screen.getByLabelText("Next")).not.toBeDisabled();
    expect(screen.getByLabelText("Last page")).not.toBeDisabled();
  });

  it("navigates to selected page when clicking a page number", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        page={1}
        totalPages={5}
        totalItems={50}
        onPageChange={onPageChange}
      />
    );

    const page3Btn = screen.getByLabelText("Page 3");
    await user.click(page3Btn);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("jumps to first page and last page when clicking First/Last buttons", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        page={5}
        totalPages={10}
        totalItems={100}
        onPageChange={onPageChange}
      />
    );

    // Click First
    await user.click(screen.getByLabelText("First page"));
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click Last
    await user.click(screen.getByLabelText("Last page"));
    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  it("jumps to specified page when using the quick jump input", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        page={1}
        totalPages={29}
        totalItems={287}
        onPageChange={onPageChange}
      />
    );

    const jumpInput = screen.getByLabelText("Jump to page");
    await user.type(jumpInput, "15");

    const goButton = screen.getByRole("button", { name: /^go$/i });
    expect(goButton).not.toBeDisabled();
    await user.click(goButton);

    expect(onPageChange).toHaveBeenCalledWith(15);
  });

  it("renders showing range format when showRange is true", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        totalItems={45}
        pageSize={10}
        showRange={true}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Showing 11 to 20 of 45 tickets/i)).toBeInTheDocument();
  });
});
