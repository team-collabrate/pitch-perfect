import { render } from "@react-email/components";

export async function renderEmailTemplate(component: React.ReactElement) {
    return render(component);
}
