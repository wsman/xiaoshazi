/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentCard from './AgentCard';

describe('AgentCard', () => {
  const defaultAgent = {
    id: 'agent-1',
    name: 'GPT-4',
    role: 'OpenAI',
    status: 'idle',
  };

  it('should render agent name', () => {
    render(<AgentCard agent={defaultAgent} />);
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('should render agent role', () => {
    render(<AgentCard agent={defaultAgent} />);
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('should render status label when showStatusLabel is true', () => {
    render(<AgentCard agent={defaultAgent} showStatusLabel={true} />);
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('should not render status label when showStatusLabel is false', () => {
    render(<AgentCard agent={defaultAgent} showStatusLabel={false} />);
    expect(screen.queryByText('idle')).not.toBeInTheDocument();
  });

  it('should use model as fallback when name is missing', () => {
    const agent = { model: 'Claude-3', role: 'Anthropic', status: 'idle' };
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('Claude-3')).toBeInTheDocument();
  });

  it('should use provider as fallback when role is missing', () => {
    const agent = { name: 'Gemini', provider: 'Google', status: 'idle' };
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('should render Unknown when no name or model provided', () => {
    const agent = { status: 'idle' };
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('Unknown Agent')).toBeInTheDocument();
  });

  it('should render large variant when isLarge is true', () => {
    const { container } = render(<AgentCard agent={defaultAgent} isLarge={true} />);
    const card = container.firstChild;
    expect(card.className).toContain('w-64');
    expect(card.className).toContain('p-6');
  });

  it('should render small variant when isLarge is false', () => {
    const { container } = render(<AgentCard agent={defaultAgent} isLarge={false} />);
    const card = container.firstChild;
    expect(card.className).toContain('w-48');
    expect(card.className).toContain('p-4');
  });

  it('should call onClick when card is clicked and clickable is true', () => {
    const handleClick = vi.fn();
    render(<AgentCard agent={defaultAgent} clickable={true} onClick={handleClick} />);
    
    const card = screen.getByText('GPT-4').closest('div');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledWith(defaultAgent);
  });

  it('should not call onClick when clickable is false', () => {
    const handleClick = vi.fn();
    render(<AgentCard agent={defaultAgent} clickable={false} onClick={handleClick} />);
    
    const card = screen.getByText('GPT-4').closest('div');
    fireEvent.click(card);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should call onHover when mouse enters card', () => {
    const handleHover = vi.fn();
    render(<AgentCard agent={defaultAgent} onHover={handleHover} />);
    
    const card = screen.getByText('GPT-4').closest('div');
    fireEvent.mouseEnter(card);
    
    expect(handleHover).toHaveBeenCalledWith(defaultAgent);
  });

  it('should display thinking status correctly', () => {
    const agent = { ...defaultAgent, status: 'thinking' };
    render(<AgentCard agent={agent} showStatusLabel={true} />);
    expect(screen.getByText('thinking')).toBeInTheDocument();
  });

  it('should display speaking status correctly', () => {
    const agent = { ...defaultAgent, status: 'speaking' };
    render(<AgentCard agent={agent} showStatusLabel={true} />);
    expect(screen.getByText('speaking')).toBeInTheDocument();
  });

  it('should display executed status correctly', () => {
    const agent = { ...defaultAgent, status: 'executed' };
    render(<AgentCard agent={agent} showStatusLabel={true} />);
    expect(screen.getByText('executed')).toBeInTheDocument();
  });

  it('should display offline status correctly', () => {
    const agent = { ...defaultAgent, status: 'offline' };
    render(<AgentCard agent={agent} showStatusLabel={true} />);
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('should show status description in large mode', () => {
    const agent = { ...defaultAgent, status: 'thinking' };
    render(<AgentCard agent={agent} isLarge={true} />);
    expect(screen.getByText(/思考中/)).toBeInTheDocument();
  });

  it('should render agent ID in small mode', () => {
    const agent = { ...defaultAgent, id: 'abc123def456' };
    render(<AgentCard agent={agent} isLarge={false} />);
    expect(screen.getByText('#abc123de')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<AgentCard agent={defaultAgent} className="custom-class" />);
    const card = container.firstChild;
    expect(card.className).toContain('custom-class');
  });

  it('should render custom icon', () => {
    const TestIcon = () => <span data-testid="custom-icon">Icon</span>;
    render(<AgentCard agent={defaultAgent} icon={<TestIcon />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
